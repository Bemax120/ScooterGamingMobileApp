import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID,
} from "@env";

// ✅ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAtjOz9FnetGrOz0gA4eexBe03OBCqdBYo",
  authDomain: "scootergamingapp-94bb4.firebaseapp.com",
  projectId: "scootergamingapp-94bb4",
  storageBucket: "scootergamingapp-94bb4.appspot.com",
  messagingSenderId: "453726606474",
  appId: "1:453726606474:web:d03639ef5990086de30973",
  measurementId: "G-NTRDR5R4EZ",
};

let app;
if (!global.firebaseApp) {
  app = initializeApp(firebaseConfig);
  global.firebaseApp = app;
} else {
  app = global.firebaseApp;
}

// ✅ Ensure Auth Persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
