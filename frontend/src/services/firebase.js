import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

for (const [key, value] of Object.entries(firebaseConfig)) {
  if (!value) {
    console.error(`Variável de ambiente faltando: ${key}`);
    throw new Error(`Variável de ambiente faltando: ${key}`);
  }
}

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { db, auth, provider };