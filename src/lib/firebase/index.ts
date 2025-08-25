
export { auth, storage, database } from './config';
export * from './auth';
export * from './storage';
export * from './points';
export * from './leaderboard';
export * from './chat';

// Re-export firebase storage functions directly
export { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
