import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { getAuth, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "../firebase/firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

const defaultProfileImage = require("../assets/download.png");

const ProfilePage = ({ route }) => {
  const filters = route?.params?.filters || {};
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneNum, setPhoneNum] = useState("");
  const navigation = useNavigation();
  const auth = getAuth();
  const currentUid = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUid) {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "Login",
            params: {
              filters,
            },
          },
        ],
      });
    }
  }, [currentUid]);

  const fetchUserData = async () => {
    if (!currentUid) return;

    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, "users", currentUid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUser({
          ...data,
          profileImage:
            data.profileImage ||
            Image.resolveAssetSource(defaultProfileImage).uri,
        });
        setPhoneNum(data.phoneNum || "");
      } else {
        setUser({
          firstName: "",
          lastName: "",
          email: auth.currentUser.email,
          profileImage: Image.resolveAssetSource(defaultProfileImage).uri,
        });
      }
    } catch (error) {
      console.error("Error retrieving user data:", error);
      Alert.alert("Error", "Could not load profile. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const uploadImage = async () => {
    if (!currentUid) {
      Alert.alert("Error", "You must be logged in to upload a photo.");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Denied", "Grant access to upload images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1],
    });
    if (result.canceled) return;

    const imageUri = result.assets[0].uri;

    try {
      setLoading(true);
      const base64Data = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const imageRef = ref(
        storage,
        `profile_pictures/personal/${currentUid}`
      );

      await uploadString(imageRef, base64Data, "base64");

      const downloadURL = await getDownloadURL(imageRef);

      await updateDoc(doc(db, "users", currentUid), {
        profileImage: downloadURL,
      });

      await fetchUserData();
      Alert.alert("Success", "Profile picture updated.");
    } catch (error) {
      console.error("❌ Upload error:", error);
      Alert.alert("Error", "Upload failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const savePhoneNumber = async () => {
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        phoneNum,
      });
      Alert.alert("Saved", "Phone number updated.");
      setEditingPhone(false);
    } catch (error) {
      console.error("Phone update error:", error);
      Alert.alert("Error", "Could not update phone number.");
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("userData");
      await signOut(auth);
      navigation.replace("Filter");
    } catch (error) {
      console.error("Logout Error:", error);
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  if (loading || !user) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4b6584" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <TouchableOpacity onPress={uploadImage}>
          <Image
            source={{ uri: user.profileImage }}
            style={styles.profileImage}
          />
          <Text style={styles.uploadText}>Upload Photo</Text>
        </TouchableOpacity>
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>
            {user.firstName} {user.lastName}
          </Text>
          <View style={styles.ridesBadge}>
            <Ionicons name="bicycle" size={18} color="white" />
            <Text style={styles.ridesText}>0 Rides</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>

        <View style={styles.infoItem}>
          <Ionicons name="mail" size={20} color="#4b6584" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email Address</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
          {user.emailVerified && (
            <Ionicons name="checkmark-circle" size={20} color="#4CD964" />
          )}
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="call" size={20} color="#4b6584" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Phone Number</Text>
            {editingPhone ? (
              <TextInput
                style={styles.input}
                value={phoneNum}
                onChangeText={setPhoneNum}
                keyboardType="phone-pad"
                placeholder="Enter phone number"
              />
            ) : (
              <Text style={styles.infoValue}>{phoneNum}</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={
              editingPhone ? savePhoneNumber : () => setEditingPhone(true)
            }
          >
            <Ionicons
              name={editingPhone ? "checkmark" : "create"}
              size={20}
              color="#007AFF"
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.uploadButton, { backgroundColor: "#FFFFFF" }]}
        onPress={() => uploadImage("verification_docs")}
      >
        <Text style={styles.uploadButtonText}>Upload Valid ID</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { paddingTop: 60, flex: 1, backgroundColor: "#F5F5F5" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { textAlign: "center", marginTop: 20, fontSize: 16, color: "red" },
  profileHeader: {
    flexDirection: "row",
    padding: 20,
    gap: 20,
    backgroundColor: "white",
    marginBottom: 15,
  },
  profileImage: { width: 80, height: 80, borderRadius: 40 },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: "black",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  uploadText: {
    color: "#EF0000",
    marginTop: 5,
    fontSize: 12,
    textAlign: "center",
  },
  profileInfo: { flex: 1, justifyContent: "center" },
  userName: { fontSize: 24, fontWeight: "700", color: "#333", marginBottom: 4 },
  memberSince: { color: "#666", marginBottom: 8 },
  ridesBadge: {
    flexDirection: "row",
    backgroundColor: "#4b6584",
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignItems: "center",
  },
  ridesText: { color: "white", marginLeft: 6, fontWeight: "600" },
  section: {
    backgroundColor: "white",
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  infoContent: { flex: 1, marginLeft: 15 },
  infoLabel: { color: "#666", fontSize: 14, marginBottom: 2 },
  infoValue: { color: "#333", fontSize: 16, fontWeight: "500" },
  input: {
    borderBottomWidth: 1,
    borderColor: "#CCC",
    paddingVertical: 4,
    fontSize: 16,
    color: "#333",
  },
  uploadButton: {
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    borderColor: "#D3D3D3",
    backgroundColor: "white",
    borderRadius: 5,
  },
  logoutButton: {
    backgroundColor: "#EF0000",
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadButtonText: { color: "#EF0000", fontSize: 16, fontWeight: "600" },
  logoutButtonText: { color: "white", fontSize: 16, fontWeight: "600" },
});

export default ProfilePage;
