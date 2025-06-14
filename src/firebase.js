// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyADDg8v092qym17pM6lxwK7utptPrQqXKg",
  authDomain: "delivery-b6076.firebaseapp.com",
  projectId: "delivery-b6076",
  storageBucket: "delivery-b6076.appspot.com",
  messagingSenderId: "81369539469",
  appId: "1:81369539469:web:28083dd67afd009c1193c4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const db = getFirestore(app);