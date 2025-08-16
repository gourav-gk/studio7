// Firebase configuration and initialization
import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getFirestore, type Firestore} from "firebase/firestore"
import { getAuth, type Auth, connectAuthEmulator } from "firebase/auth"

// Firebase configuration object
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase app (singleton pattern)
let app: FirebaseApp
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}

// Initialize Firestore
export const db: Firestore = getFirestore(app)

// Initialize Auth
export const auth: Auth = getAuth(app)

// Connect to emulators in development
if (process.env.NODE_ENV === "development") {
  try {
    // // Connect to Firestore emulator
    // if (!db._delegate._databaseId.projectId.includes("demo-")) {
    //   connectFirestoreEmulator(db, "localhost", 8080)
    // }

    // Connect to Auth emulator
    if (!auth.config.apiKey?.includes("demo-")) {
      connectAuthEmulator(auth, "http://localhost:9099")
    }
  } catch (error) {
    // Emulators already connected or not available
    console.log("Firebase emulators connection skipped:", error)
  }
}

// Collection names constants
export const COLLECTIONS = {
  ATTENDANCE: "attendance",
  CLIENTS: "clients",
  DELIVERABLES: "deliverables",
  ENQUIRY: "enquiry",
  EVENTS: "events",
  PACKAGES: "packages",
  PROJECTS: "projects",
  SALARY: "salary",
  SHOOTS: "shoots",
  TASKS: "tasks",
  TRANSACTIONS: "transactions",
  USERS: "users",
} as const

// Export the Firebase app instance
export default app

// Helper function to check if Firebase is properly configured
export const isFirebaseConfigured = (): boolean => {
  return !!(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId)
}

// Helper function to get collection reference
export const getCollectionName = (collection: keyof typeof COLLECTIONS): string => {
  return COLLECTIONS[collection]
}
