import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDiJhfxgpH793R8m2mlldva3zU_rfcIZbA",
  authDomain: "mentora-ai-5c6b0.firebaseapp.com",
  projectId: "mentora-ai-5c6b0",
  storageBucket: "mentora-ai-5c6b0.firebasestorage.app",
  messagingSenderId: "224132583967",
  appId: "1:224132583967:web:17957b1eb06d7ee01cbb2a",
  measurementId: "G-MJLMR91ZRX"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  auth = getAuth(app);
}

const db = getFirestore(app);

export { auth, db };


