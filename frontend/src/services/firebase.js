// src/services/firebase.js (ou src/firebase.js)
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Configuração do Firebase do seu projeto
const firebaseConfig = {
  apiKey: "AIzaSyBX7n4-x0Z1LGZMMeioxhlB28tm7nFENFg",
  authDomain: "vocational-test-90cd1.firebaseapp.com",
  projectId: "vocational-test-90cd1",
  storageBucket: "vocational-test-90cd1.firebasestorage.app",
  messagingSenderId: "375023648945",
  appId: "1:375023648945:web:a68468e539b33d5f092290",
  measurementId: "G-2R8NP3KJ58"
};

// Inicializa o app Firebase
const app = initializeApp(firebaseConfig);

// Inicializa e exporta o Firestore
const db = getFirestore(app);

// Inicializa e exporta o Auth 🔐
const auth = getAuth(app);

export { db, auth };
