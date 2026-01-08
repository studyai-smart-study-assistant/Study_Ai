import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { auth, database } from "./config";
import { generateReferralCode } from "@/utils/points/referralSystem";
import { addPointsToUser } from "@/utils/points/core";

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user already exists in database
    const userRef = ref(database, `users/${user.uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      // New user - create profile
      await set(userRef, {
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || null,
        createdAt: Date.now(),
        points: 0,
        level: 1,
        provider: 'google'
      });

      // Generate referral code
      await generateReferralCode(user.uid);

      // Give welcome bonus
      await addPointsToUser(user.uid, 50, 'achievement', 'स्वागत बोनस - 50 पॉइंट्स! 🎉');
    }

    return user;
  } catch (error: any) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};
