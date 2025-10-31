import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  getDatabase,
  connectDatabaseEmulator,
  goOnline,
} from 'firebase/database'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY as string,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL as string,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: process.env
    .NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID as string,
}

const app: FirebaseApp = getApps().length
  ? getApps()[0]!
  : initializeApp(firebaseConfig)

export const db = getDatabase(app)

// Ensure database stays online and maintains connection
// Realtime Database has offline persistence enabled by default,
// but we explicitly ensure it stays online
if (typeof window !== 'undefined') {
  goOnline(db)
}
