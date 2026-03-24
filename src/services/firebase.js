import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAsVVmDiP-nsevCvLW1dQOqPJ4kSx7Uvo0",
  authDomain: "musicapp-1ab58.firebaseapp.com",
  databaseURL: "https://musicapp-1ab58-default-rtdb.firebaseio.com",
  projectId: "musicapp-1ab58",
  storageBucket: "musicapp-1ab58.firebasestorage.app",
  messagingSenderId: "821077091907",
  appId: "1:821077091907:web:dd490fe4e379d92ce716f6",
  measurementId: "G-TPYJKQSNWV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
try { getAnalytics(app); } catch (e) { }

export default app;
