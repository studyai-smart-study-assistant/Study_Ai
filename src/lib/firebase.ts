
// Import Firebase functions first
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged 
} from "firebase/auth";

import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";

import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getDatabase } from "firebase/database";

// Re-export everything from modular Firebase structure
export { 
  auth, 
  database, 
  storage 
} from './firebase/config';

// Re-export all functions from modular files
export { 
  loginUser, 
  registerUser, 
  logoutUser, 
  resetPassword,
  getUserProfile 
} from './firebase/auth';

export { 
  sendMessage, 
  getGroupDetails, 
  deleteMessage, 
  toggleSaveMessage,
  listenForMessages,
  getUserChats,
  getUserGroups,
  startChat,
  createChatGroup,
  updateGroupMembership,
  deleteGroup,
  onMessage
} from './firebase/chat';

export { 
  getLeaderboardData,
  observeLeaderboardData 
} from './firebase/leaderboard';

export { 
  addPointsToUserDb,
  getUserPointsHistory 
} from './firebase/points';

// Re-export firebase storage functions
export { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
export { getDatabase } from "firebase/database";
export { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged 
} from "firebase/auth";

export { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
