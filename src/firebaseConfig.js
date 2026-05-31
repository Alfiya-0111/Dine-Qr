import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getFunctions } from "firebase/functions";

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

// ── Customer App (default) ─────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);
getAnalytics(app);

export const auth        = getAuth(app);
export const db          = getFirestore(app);
export const realtimeDB  = getDatabase(app);
export const firestore   = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const functions   = getFunctions(app);

// ── Admin App (alag instance) ──────────────────────────────────────────────
const adminApp = initializeApp(firebaseConfig, "adminApp");

export const adminAuth = getAuth(adminApp);

export default app;