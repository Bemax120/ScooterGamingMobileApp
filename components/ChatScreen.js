// ChatScreen.js
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // ensure this is from expo/vector-icons
import BookingBannerMobile from '../components/BookingBannerMobile';

// Firebase setup
import { auth, storage, db } from "../firebase/firebaseConfig";
import {
  getOrCreateConversation,
  subscribeMessages,
  sendMessage,
} from "../firebase/messageService";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { ref as storageRef, uploadString, getDownloadURL } from "firebase/storage";

export default function ChatScreen({ navigation, route }) {
  const currentUid = auth.currentUser?.uid;
  const otherUserId = route.params?.otherUserId;
  const businessName = route.params?.businessName || "Chat";

  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loadingSendImage, setLoadingSendImage] = useState(false);

  // 1) If otherUserId is missing, go back
  useEffect(() => {
    if (!otherUserId) {
      console.error("ChatScreen: missing otherUserId in navigation params");
      Alert.alert("Error", "Cannot open chat — user ID is missing.");
      navigation.goBack();
    }
  }, [otherUserId]);

  // 2) Create (or fetch) the conversation
  useEffect(() => {
    if (!otherUserId || !currentUid) return;
    let isMounted = true;
    getOrCreateConversation(currentUid, otherUserId)
      .then((convId) => {
        if (isMounted) setConversationId(convId);
      })
      .catch((err) => {
        console.error("Error getting/creating conversation:", err);
        Alert.alert("Error", "Could not initialize chat. Try again later.");
      });
    return () => {
      isMounted = false;
    };
  }, [otherUserId, currentUid]);

  // 3) Subscribe to messages once we have conversationId
  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = subscribeMessages(conversationId, (msgArr) => {
      setMessages(msgArr);
    });
    return () => unsubscribe();
  }, [conversationId]);

  // 4) Send plain‐text (or emoji from keyboard) message
  const handleSendText = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) return; // do not send empty

    if (!otherUserId) {
      console.error("Cannot send message—otherUserId is undefined");
      return;
    }
    try {
      let convId = conversationId;
      if (!convId) {
        convId = await getOrCreateConversation(currentUid, otherUserId);
        setConversationId(convId);
      }
      await sendMessage(convId, currentUid, { text: trimmed });
      setInputText("");
    } catch (err) {
      console.error("Error sending message:", err);
      Alert.alert("Error", "Failed to send. Try again.");
    }
  };

  // 5) Pick a photo and send it as a message
  const handlePickAndSendImage = async () => {
    if (!otherUserId) return;

    // 5a) Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "We need library access to send images.");
      return;
    }

    // 5b) Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled) return;

    const imageUri = result.assets[0].uri;
    if (!imageUri) return;

    try {
      setLoadingSendImage(true);

      // 5c) Convert to base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 5d) Ensure conversation exists
      let convId = conversationId;
      if (!convId) {
        convId = await getOrCreateConversation(currentUid, otherUserId);
        setConversationId(convId);
      }

      // 5e) Upload to Storage
      const timestamp = Date.now();
      const filePath = `chatImages/${convId}/${currentUid}_${timestamp}.jpg`;
      const imgRef = storageRef(storage, filePath);
      await uploadString(imgRef, base64, "base64");

      // 5f) Get download URL
      const downloadURL = await getDownloadURL(imgRef);

      // 5g) Send message with imageUrl
      await sendMessage(convId, currentUid, { imageUrl: downloadURL });

      setLoadingSendImage(false);
    } catch (error) {
      console.error("❌ Upload & send image error:", error);
      Alert.alert("Error", "Failed to send image. Try again.");
      setLoadingSendImage(false);
    }
  };

  // 6) Render each message item: show <Image> if imageUrl, else <Text>
  const renderMessage = ({ item }) => {
    const isMe = item.senderId === currentUid;
    return (
      <View
        style={[
          styles.messageContainer,
          isMe ? styles.userMessage : styles.recipientMessage,
        ]}
      >
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.messageText}>{item.text}</Text>
        )}
      </View>
    );
  };

  // Show a full‐screen loader if we're in the middle of uploading an image
  if (!conversationId && messages.length === 0 && loadingSendImage) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#EF0000" />
        <Text style={{ marginTop: 8 }}>Sending image...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {otherUserId && <BookingBannerMobile userId={otherUserId} />}

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{businessName}</Text>
      </View>

      {/* CHAT LIST & INPUT */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatList}
        />

        <View style={styles.inputContainer}>
          {/* Photo button */}
          <TouchableOpacity
            onPress={handlePickAndSendImage}
            style={styles.iconButton}
          >
            <Ionicons name="camera" size={24} color="#4b6584" />
          </TouchableOpacity>

          {/* Text input (can still type emojis via system keyboard) */}
          <TextInput
            style={styles.input}
            placeholder="Type a message…"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSendText}
            multiline
          />

          {/* Send button */}
          <TouchableOpacity style={styles.sendButton} onPress={handleSendText}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Overlay spinner while uploading */}
      {loadingSendImage && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF0000",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
  },
  chatList: {
    padding: 16,
    paddingBottom: 100, // leave room for input area
  },
  messageContainer: {
    maxWidth: "75%",
    padding: 8,
    borderRadius: 12,
    marginBottom: 12,
  },
  userMessage: {
    backgroundColor: "#DCF8C6",
    alignSelf: "flex-end",
  },
  recipientMessage: {
    backgroundColor: "#F1F0F0",
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 15,
    color: "#000",
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: "#ddd",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#F9F9F9",
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  iconButton: {
    marginHorizontal: 6,
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 6,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#EF0000",
    padding: 10,
    borderRadius: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
});
