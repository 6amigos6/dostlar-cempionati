import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getAuth } from 'firebase/auth'

// NOTE: this is the Firebase project config supplied for this build.
// Realtime Database security rules must be set in the Firebase console —
// see README.md "Firebase quraşdırılması" section before going live.
// Firebase konfiqurasiyası: VITE_FIREBASE_* dəyişənləri təyin edilibsə onlardan oxunur,
// yoxdursa standart (repo daxilindəki) config istifadə olunur.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDso9kaf-q75gAS3iA2Rpt1HULB4qIdp0k',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'websitetest-88143.firebaseapp.com',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://websitetest-88143-default-rtdb.firebaseio.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'websitetest-88143',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'websitetest-88143.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '330104673598',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:330104673598:web:cd72641d537fceb29d886f',
}

export const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
export const auth = getAuth(app)
