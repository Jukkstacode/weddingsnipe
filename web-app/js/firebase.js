import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

const app = initializeApp({
  apiKey: 'AIzaSyDtbnBa_wok-tRS-A2xraRBMJE8oM5Hc6c',
  authDomain: 'wedding-snipe.firebaseapp.com',
  projectId: 'wedding-snipe',
  storageBucket: 'wedding-snipe.firebasestorage.app',
  messagingSenderId: '347732622266',
  appId: '1:347732622266:web:db85733e367e9c2ae37b83',
});

export const db = getFirestore(app);
export const auth = getAuth(app);
export const signIn = () => signInWithPopup(auth, new GoogleAuthProvider());
export { signOut, onAuthStateChanged };
