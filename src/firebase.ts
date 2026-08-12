import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAj8JrH2TruI2qy_Asn4TLoEgkkSHMJVe8",
  authDomain: "youssef-development-club.firebaseapp.com",
  projectId: "youssef-development-club",
  storageBucket: "youssef-development-club.firebasestorage.app",
  messagingSenderId: "785123956722",
  appId: "1:785123956722:web:91f119a72ba69d1f68fd6b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);