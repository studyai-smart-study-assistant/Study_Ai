
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDrd-WaRLM6C2Z5ZlCkhN20sXUObxUUYX0",
  authDomain: "edugine-01.firebaseapp.com",
  databaseURL: "https://edugine-01-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "edugine-01",
  storageBucket: "edugine-01.appspot.com",
  messagingSenderId: "556004873116",
  appId: "1:556004873116:web:e1a41b28052a88d0432e59",
  measurementId: "G-MVSWT657FP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export { app };
export const auth = getAuth(app);
export const storage = getStorage(app);
export const database = getDatabase(app);
