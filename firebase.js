import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCewDiHzRv18_FnmBzuyo00rgo__9HtZKc",
  authDomain: "libro-xv-alfonsina.firebaseapp.com",
  projectId: "libro-xv-alfonsina",
  storageBucket: "libro-xv-alfonsina.firebasestorage.app",
  messagingSenderId: "793654895943",
  appId: "1:793654895943:web:55db375ccf9b439b761862"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
