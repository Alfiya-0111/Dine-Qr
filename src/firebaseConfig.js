// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBMXmog0yjTcmpEb9wbVY288ISBdWxxGUM",
  authDomain: "dineqr-ec134.firebaseapp.com",
  databaseURL: "https://dineqr-ec134-default-rtdb.firebaseio.com",
  projectId: "dineqr-ec134",
  storageBucket: "dineqr-ec134.appspot.com",
  messagingSenderId: "797819452172",
  appId: "1:797819452172:web:0ac199af1467adc095e729",
  measurementId: "G-RX9DXCRY90",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
getAnalytics(app);

// ✅ Export main Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app); // <-- Firestore database
export const rtdb = getDatabase(app); // <-- Realtime Database (for comments, etc.)
export const realtimeDB = getDatabase(app);
export const firestore = getFirestore(app); // 🔥 Add this line for Firestore
export const googleProvider = new GoogleAuthProvider();

export default app;
