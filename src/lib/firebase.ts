import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  signOut as fbSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Always provide firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
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
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    return true;
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorCode = (error && typeof error === "object" && "code" in error) ? (error as any).code : "";
    if (
      errorCode === "unavailable" ||
      errorMsg.includes("the client is offline") ||
      errorMsg.includes("unavailable") ||
      errorMsg.includes("Could not reach Cloud Firestore")
    ) {
      console.warn("Firestore connection check: operating in resilient offline/local mode while backend establishes connection.");
    } else {
      console.warn("Firestore connection status:", errorMsg);
    }
    return false;
  }
}

// Authentication Helpers
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    if (user) {
      // Sync user profile to Firestore
      const userRef = doc(db, "users", user.uid);
      const now = new Date().toISOString();
      await setDoc(
        userRef,
        {
          userId: user.uid,
          email: user.email || "",
          displayName: user.displayName || "Commander",
          photoURL: user.photoURL || "",
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );
    }
    return user;
  } catch (err: any) {
    console.error("Google sign-in error:", err);
    throw err;
  }
}

export async function signOutUser() {
  return fbSignOut(auth);
}

// Sync Message to Firestore
export async function syncMessageToFirestore(
  userId: string,
  message: {
    id: string;
    sender: "user" | "jarvis" | "system";
    text: string;
    timestamp: string;
    isVoiceInput?: boolean;
  }
) {
  const path = `users/${userId}/messages/${message.id}`;
  try {
    const sanitizedId = message.id.replace(/[^a-zA-Z0-9_-]/g, "_");
    await setDoc(doc(db, "users", userId, "messages", sanitizedId), {
      id: sanitizedId,
      userId,
      sender: message.sender,
      text: message.text.slice(0, 4800),
      timestamp: message.timestamp,
      isVoiceInput: !!message.isVoiceInput,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Sync Task to Firestore
export async function syncTaskToFirestore(
  userId: string,
  task: {
    id: string;
    title: string;
    category: "work" | "research" | "automation" | "personal";
    priority: "high" | "medium" | "low";
    completed: boolean;
  }
) {
  const sanitizedId = task.id.replace(/[^a-zA-Z0-9_-]/g, "_");
  const path = `users/${userId}/tasks/${sanitizedId}`;
  try {
    const now = new Date().toISOString();
    await setDoc(doc(db, "users", userId, "tasks", sanitizedId), {
      id: sanitizedId,
      userId,
      title: task.title,
      category: task.category,
      priority: task.priority,
      completed: task.completed,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete Task from Firestore
export async function deleteTaskFromFirestore(userId: string, taskId: string) {
  const sanitizedId = taskId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const path = `users/${userId}/tasks/${sanitizedId}`;
  try {
    await deleteDoc(doc(db, "users", userId, "tasks", sanitizedId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Toggle Task in Firestore
export async function toggleTaskInFirestore(userId: string, taskId: string, completed: boolean) {
  const sanitizedId = taskId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const path = `users/${userId}/tasks/${sanitizedId}`;
  try {
    await updateDoc(doc(db, "users", userId, "tasks", sanitizedId), {
      completed,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Save Research Dossier to Firestore
export async function saveDossierToFirestore(
  userId: string,
  dossier: {
    id?: string;
    topic: string;
    title: string;
    executiveSummary: string;
    dossierJson: any;
  }
) {
  const docId = (dossier.id || `dossier_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, "_");
  const path = `users/${userId}/research_dossiers/${docId}`;
  try {
    await setDoc(doc(db, "users", userId, "research_dossiers", docId), {
      id: docId,
      userId,
      topic: dossier.topic.slice(0, 250),
      title: dossier.title.slice(0, 250),
      executiveSummary: dossier.executiveSummary.slice(0, 9500),
      dossierJson: JSON.stringify(dossier.dossierJson).slice(0, 48000),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete Research Dossier from Firestore
export async function deleteDossierFromFirestore(userId: string, dossierId: string) {
  const sanitizedId = dossierId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const path = `users/${userId}/research_dossiers/${sanitizedId}`;
  try {
    await deleteDoc(doc(db, "users", userId, "research_dossiers", sanitizedId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Sync Voice Settings to Firestore
export async function syncVoiceSettingsToFirestore(
  userId: string,
  settings: {
    pitch: number;
    rate: number;
    voiceURI?: string;
    presetName?: string;
    language?: string;
  }
) {
  const path = `users/${userId}/settings/voice`;
  try {
    await setDoc(
      doc(db, "users", userId, "settings", "voice"),
      {
        userId,
        pitch: settings.pitch,
        rate: settings.rate,
        voiceURI: settings.voiceURI || "",
        presetName: settings.presetName || "Custom",
        language: settings.language || "auto",
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

