import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { connectAuthEmulator } from "firebase/auth";
import firebaseJsonConfig from "./firebase-applet-config.json";

const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  // optional: for non-default databases
  firestoreDatabaseId: import.meta.env.VITE_FIRESTORE_DATABASE_ID,
};

// Prefer explicit environment variables (useful for Vercel). Fall back to the
// local JSON file for dev if env vars are not provided.
const firebaseConfig =
  envConfig.apiKey && envConfig.projectId
    ? envConfig
    : (firebaseJsonConfig as Record<string, string>);

// Basic validation to help diagnose "Database '(default)' not found" errors.
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    "Firebase configuration is missing. Set VITE_FIREBASE_* env vars in Vercel or provide a valid src/firebase-applet-config.json",
  );
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export {
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
};

export const OperationType = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  LIST: "list",
  GET: "get",
  WRITE: "write",
} as const;

export type OperationType = (typeof OperationType)[keyof typeof OperationType];

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  // Log the error for diagnostics but do not re-throw to avoid breaking
  // listeners and long-running auth handlers in the app.
  return;
}

// If running locally and using the emulators, connect to them when requested
if (import.meta.env.VITE_USE_FIRESTORE_EMULATOR === "true") {
  const host = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST || "localhost";
  const port = Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || 8080);
  console.info(`Connecting Firestore to emulator at ${host}:${port}`);
  try {
    connectFirestoreEmulator(db, host, port);
  } catch (e) {
    console.warn("Could not connect Firestore emulator:", e);
  }
  // Optionally connect auth emulator if configured
  const authHost = import.meta.env.VITE_AUTH_EMULATOR_HOST || "localhost";
  const authPort = Number(import.meta.env.VITE_AUTH_EMULATOR_PORT || 9099);
  if (import.meta.env.VITE_USE_AUTH_EMULATOR === "true") {
    try {
      connectAuthEmulator(auth, `http://${authHost}:${authPort}`);
      console.info(`Connecting Auth to emulator at ${authHost}:${authPort}`);
    } catch (e) {
      console.warn("Could not connect Auth emulator:", e);
    }
  }
}
