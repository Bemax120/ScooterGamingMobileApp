import {
    collection, query, where, addDoc, orderBy,
    serverTimestamp, onSnapshot, doc, getDoc, setDoc, updateDoc
  } from "firebase/firestore";
  import { db } from "./firebaseConfig";
  
  /**
   * Returns a conversation ID for two user‐IDs (sorted and joined by “_”),
   * creating a new document under "conversations/{convId}" if it does not exist.
   *
   * Each conversation doc has:
   *   - participants: [u1, u2]
   *   - lastMessage: string
   *   - lastMessageTime: timestamp
   *
   * @param {string} u1 – first user's UID
   * @param {string} u2 – second user's UID
   * @returns {Promise<string>} convId
   */
  export async function getOrCreateConversation(u1, u2) {
    const convId = [u1, u2].sort().join("_");
    const convRef = doc(db, "conversations", convId);
    const snap = await getDoc(convRef);
    if (!snap.exists()) {
      await setDoc(convRef, {
        participants: [u1, u2],
        lastMessage: "",
        lastMessageTime: serverTimestamp()
      });
    }
    return convId;
  }
  
  /**
   * Subscribes to all messages under "conversations/{convId}/messages",
   * ordered by createdAt ascending. Calls `cb` with an array of normalized
   * message objects: { id, senderId, text (string|null), imageUrl (string|null), createdAt }.
   *
   * This handles both old documents (which might have `message` field) and
   * new documents (with `text` and/or `imageUrl`).
   *
   * @param {string} conversationId
   * @param {(messages: Array<{id:string, senderId:string, text?:string, imageUrl?:string, createdAt: any}>)} cb
   * @returns {() => void} unsubscribe function
   */
  export function subscribeMessages(conversationId, cb) {
    const msgsRef = collection(db, "conversations", conversationId, "messages");
    const q = query(msgsRef, orderBy("createdAt", "asc"));
    return onSnapshot(q, snap => {
      const allMessages = snap.docs.map(docSnap => {
        const data = docSnap.data();
        // If the document uses old `message` field, map it to `text`.
        const textContent = data.text !== undefined ? data.text : data.message || null;
        return {
          id: docSnap.id,
          senderId: data.senderId,
          text: textContent,
          imageUrl: data.imageUrl || null,
          createdAt: data.createdAt,
        };
      });
      cb(allMessages);
    });
  }
  
  /**
   * Sends a new message under "conversations/{convId}/messages".
   * Accepts `payload` which may contain:
   *   - text (string)    → plain text or emojis
   *   - imageUrl (string) → link to a photo in Storage
   *
   * Also updates the parent conversation's `lastMessage` and `lastMessageTime`.
   *
   * Example usage:
   *   sendMessage(convId, senderId, { text: "Hello 😊" });
   *   sendMessage(convId, senderId, { imageUrl: "https://..." });
   *   sendMessage(convId, senderId, { text:"See this", imageUrl:"https://..." });
   *
   * @param {string} conversationId
   * @param {string} senderId
   * @param {{ text?: string, imageUrl?: string }} payload
   * @returns {Promise<void>}
   */
  export async function sendMessage(conversationId, senderId, payload) {
    if (!payload.text && !payload.imageUrl) {
      throw new Error("sendMessage requires at least `text` or `imageUrl` in payload.");
    }
  
    const msgsRef = collection(db, "conversations", conversationId, "messages");
    const messageData = {
      senderId,
      createdAt: serverTimestamp(),
      // store `text` only if provided
      ...(payload.text ? { text: payload.text } : {}),
      // store `imageUrl` only if provided
      ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}),
    };
  
    // 1) Add the new message document
    await addDoc(msgsRef, messageData);
  
    // 2) Decide what to write into `lastMessage` at the conversation level
    let lastMessageString = "";
    if (payload.text) {
      lastMessageString = payload.text;
    } else if (payload.imageUrl) {
      lastMessageString = "[Photo]";
    }
  
    // 3) Update the parent conversation's lastMessage & lastMessageTime
    const convRef = doc(db, "conversations", conversationId);
    await updateDoc(convRef, {
      lastMessage: lastMessageString,
      lastMessageTime: serverTimestamp(),
    });
  }