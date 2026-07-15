import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Check if config has been supplied
const isConfigured = !!firebaseConfig.apiKey;

// Initialize Firebase services
export const app = isConfigured ? initializeApp(firebaseConfig) : null;
export const auth = isConfigured ? getAuth(app!) : null;
export const db = isConfigured ? getFirestore(app!) : null;
export const googleProvider = isConfigured ? new GoogleAuthProvider() : null;

// Initialize Analytics conditionally based on browser support
if (isConfigured && app) {
  isSupported().then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  });
}
