import React, { useState, useCallback } from "react";
import {
  Image,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  BackHandler,
  ToastAndroid,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { SocialIcon } from "react-native-elements";
import { auth, db } from "../firebase/firebaseConfig";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";

const defaultProfileImage = require("../assets/download.png");
const Availio = require("../assets/Availio.png");

const LoginScreen = ({ navigation, route, setIsLoggedIn }) => {

  const filters = route?.params?.filters || {};

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchEmailFromUsername = async (username) => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data().email;
      }
      return null;
    } catch (error) {
      console.error("Error fetching email:", error);
      return null;
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        ToastAndroid.show("Please continue as a Guest to continue", ToastAndroid.SHORT);
        return true; // prevent default back behavior
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => backHandler.remove();
    }, [])
  );


  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert("Error", "Both fields are required!");
      return;
    }

    setLoading(true);
    let emailToUse = identifier;

    if (!identifier.includes("@")) {
      const foundEmail = await fetchEmailFromUsername(identifier);
      if (!foundEmail) {
        setLoading(false);
        Alert.alert("Error", "Username not found!");
        return;
      }
      emailToUse = foundEmail;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        emailToUse,
        password
      );
      const user = userCredential.user;

      if (!user) {
        throw new Error("User not found after login.");
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();

        if (!userData.emailVerified) {
          setLoading(false);
          Alert.alert("Error", "Please verify your email before logging in.");
          return;
        }

        const finalUserData = {
          ...userData,
          profileImage:
            userData.profileImage ||
            Image.resolveAssetSource(defaultProfileImage).uri,
        };

        await AsyncStorage.setItem("userData", JSON.stringify(finalUserData));
        Alert.alert("Success", `Welcome, ${finalUserData.firstName}!`);
        setIsLoggedIn(true); // <-- set global login state

        Alert.alert("Success", `Welcome, ${finalUserData.firstName}!`);
        navigation.navigate("HomeTabs", {
          filters,
        });
      } else {
        throw new Error("User data not found in Firestore");
      }
    } catch (error) {
      console.error("❌ Login Error:", error);
      Alert.alert(
        "Error",
        error.message || "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={{
          width: "100%",
          flexDirection: "row",
          justifyContent: "center",
          alignContent: "center",
        }}
      >
        <Image style={{ width: 100, height: 100 }} source={Availio} />
      </View>
      <Text
        style={{
          fontSize: 24,
          marginTop: 10,
          textAlign: "center",
          fontWeight: "bold",
          color: "#333",
        }}
      >
        Login
      </Text>
      <Text style={styles.title}>Login Now To Continue Booking!</Text>

      <TextInput
        style={styles.input}
        placeholder="Email or Username"
        autoCapitalize="none"
        value={identifier}
        onChangeText={setIdentifier}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
        <Text style={styles.forgotPassword}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, loading && styles.disabledButton]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Enter</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.orText}>or</Text>

      <SocialIcon title="Sign in with Google" button type="google" />
      <SocialIcon title="Sign in with Facebook" button type="facebook" />

      <Text style={styles.registerText}>
        Don't have an account?{" "}
        <Text
          style={styles.registerLink}
          onPress={() => navigation.navigate("Register")}
        >
          Register Here.
        </Text>
      </Text>
      <Text
        onPress={() => navigation.navigate("HomeTabs", { filters })}
        style={styles.registerText}
      >
        Continue as Guest
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#FCFBF4",
  },
  title: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: "#f9f9f9",
  },
  forgotPassword: {
    textAlign: "right",
    color: "#007BFF",
    marginBottom: 20,
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#ff0000",
    padding: 15,
    borderRadius: 100,
    alignItems: "center",
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  orText: {
    textAlign: "center",
    marginBottom: 20,
    color: "#888",
  },
  registerText: {
    textAlign: "center",
    marginTop: 20,
    color: "#888",
    fontSize: 14,
  },
  registerLink: {
    color: "#ff0000",
    fontWeight: "bold",
  },
});

export default LoginScreen;