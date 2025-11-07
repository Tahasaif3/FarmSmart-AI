// lib/firebase.ts
import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getDatabase } from "firebase/database"

const firebaseConfig = {
  apiKey: "AIzaSyAnqRm4N-02zRDpRAeNNBDPIHwZnwWLDpw",
  authDomain: "softgpt-b3df3.firebaseapp.com",
  databaseURL: "https://softgpt-b3df3-default-rtdb.firebaseio.com", // ✅ RTDB URL
  projectId: "softgpt-b3df3",
  storageBucket: "softgpt-b3df3.firebasestorage.app",
  messagingSenderId: "987218911563",
  appId: "1:987218911563:web:b950092bf663fad449c8ce",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Export services
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const rtdb = getDatabase(app)
