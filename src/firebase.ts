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
import firebaseConfig from "./firebase-applet-config.json";

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
