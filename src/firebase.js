import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getAuth } from 'firebase/auth'

// NOTE: this is the Firebase project config supplied for this build.
// Realtime Database security rules must be set in the Firebase console —
// see README.md "Firebase quraşdırılması" section before going live.
const firebaseConfig = {
  apiKey: 'AIzaSyDso9kaf-q75gAS3iA2Rpt1HULB4qIdp0k',
  authDomain: 'websitetest-88143.firebaseapp.com',
  databaseURL: 'https://websitetest-88143-default-rtdb.firebaseio.com',
  projectId: 'websitetest-88143',
  storageBucket: 'websitetest-88143.firebasestorage.app',
  messagingSenderId: '330104673598',
  appId: '1:330104673598:web:cd72641d537fceb29d886f',
}

export const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
export const auth = getAuth(app)
