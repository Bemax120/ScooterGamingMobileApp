import {
    collection, query, where, addDoc, orderBy,
    serverTimestamp, onSnapshot, doc, getDoc, setDoc, updateDoc
  } from "firebase/firestore";
  import { db } from "./firebaseConfig";
  
  export async function getOrCreateConversation(u1, u2) {
    const convId = [u1, u2].sort().join("_");
    const ref = doc(db, "conversations", convId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        participants: [u1, u2],
        lastMessage: "",
        lastMessageTime: serverTimestamp()
      });
    }
    return convId;
  }
  
  export function subscribeMessages(conversationId, cb) {
    const msgsRef = collection(db, "conversations", conversationId, "messages");
    const q = query(msgsRef, orderBy("createdAt", "asc"));
    return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }
  
  export async function sendMessage(conversationId, senderId, text) {
    const msgsRef = collection(db, "conversations", conversationId, "messages");
    await addDoc(msgsRef, {
      senderId,
      message: text,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "conversations", conversationId), {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
    });
  }