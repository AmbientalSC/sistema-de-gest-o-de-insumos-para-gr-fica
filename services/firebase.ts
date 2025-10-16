// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCJ4Qz6Is96-tIW8xFv6WREOa8u-zly4_w",
  authDomain: "gestao-estoque-f4b01.firebaseapp.com",
  projectId: "gestao-estoque-f4b01",
  storageBucket: "gestao-estoque-f4b01.firebasestorage.app",
  messagingSenderId: "956505697119",
  appId: "1:956505697119:web:7ae04b3a7eae2d157e64ea"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
