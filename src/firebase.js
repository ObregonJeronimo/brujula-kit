import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, where, updateDoc, enableNetwork, disableNetwork } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log("=== FIREBASE CONFIG DEBUG ===");
console.log("projectId:", firebaseConfig.projectId || "❌ VACÍO");
console.log("apiKey:", firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0,10)+"..." : "❌ VACÍO");
console.log("authDomain:", firebaseConfig.authDomain || "❌ VACÍO");
console.log("appId:", firebaseConfig.appId ? firebaseConfig.appId.substring(0,10)+"..." : "❌ VACÍO");
console.log("All env keys:", Object.keys(import.meta.env).filter(k=>k.startsWith("VITE_")).join(", ") || "❌ NINGUNA");
console.log("=== END CONFIG DEBUG ===");

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, getDocs, deleteDoc, doc, query, where, updateDoc };
