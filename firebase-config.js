// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  getDocs, 
  updateDoc,
  query, // Add this
  where  // Add this
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBcaSNQuZizwEo39oz5zpCirHyuSK78Htk",
  authDomain: "basic-curve-447915-i9.firebaseapp.com",
  projectId: "basic-curve-447915-i9",
  storageBucket: "basic-curve-447915-i9.appspot.com",
  messagingSenderId: "824954986365",
  appId: "1:824954986365:web:fc974280d4da46ae1f3614",
  measurementId: "G-50LPQ2GDHK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { 
  auth, 
  db, 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword, 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  getDocs, 
  updateDoc,
  query, // Export this
  where  // Export this
};