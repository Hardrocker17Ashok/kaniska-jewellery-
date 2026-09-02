import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCDMHyjoUd4Kpc3qZoK3UukX9b_oPE7gSg",
  authDomain: "kaniska-jewellers.firebaseapp.com",
  projectId: "kaniska-jewellers",
  storageBucket: "kaniska-jewellers.firebasestorage.app",
  messagingSenderId: "402089150992",
  appId: "1:402089150992:web:4866d54620094c28bd5895"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;