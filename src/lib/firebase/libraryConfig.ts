
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// Library Firebase configuration
const libraryFirebaseConfig = {
  apiKey: "AIzaSyCLHxz_mNBpVsmbDPa1VvWqzjslXHO9qnY",
  authDomain: "location-169d9.firebaseapp.com",
  databaseURL: "https://location-169d9-default-rtdb.firebaseio.com",
  projectId: "location-169d9",
  storageBucket: "location-169d9.firebasestorage.app",
  messagingSenderId: "459804900467",
  appId: "1:459804900467:web:d361c536063a08c3dbfe06",
  measurementId: "G-44CB5945XE"
};

// Initialize Firebase
const libraryApp = initializeApp(libraryFirebaseConfig, "library");
export const libraryAuth = getAuth(libraryApp);
export const libraryStorage = getStorage(libraryApp);
export const libraryDb = getFirestore(libraryApp);
