// Firebase Configuration and Authentication Service for VeraCost
// Initializes Firebase Auth and Firestore with graceful offline / guest mode support

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  Firestore,
} from 'firebase/firestore';

export interface UserProfileData {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  createdAt: string;
  lastLoginAt: string;
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export function isFirebaseConfigured(): boolean {
  const key = firebaseConfig.apiKey;
  return Boolean(
    key &&
    key.trim() !== '' &&
    !key.includes('your_firebase') &&
    firebaseConfig.projectId &&
    !firebaseConfig.projectId.includes('your_')
  );
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.warn('[Firebase] Initialization warning:', err);
  }
}

export { auth, db };

/**
 * Register a new user with Email, Password, Display Name, and Phone Number
 */
export async function registerWithEmailAndPassword(
  email: string,
  pass: string,
  name: string,
  phone: string
): Promise<{ user: User; profile: UserProfileData }> {
  if (!auth) {
    throw new Error('Firebase is not configured. Please configure Firebase in your environment or use Guest Mode.');
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  const user = userCredential.user;

  // 1. Update Firebase Auth Display Name
  await updateProfile(user, {
    displayName: name.trim(),
  });

  // 2. Persist full profile to Firestore if available
  const profile: UserProfileData = {
    uid: user.uid,
    email: user.email || email.trim(),
    displayName: name.trim(),
    phoneNumber: phone.trim() || undefined,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  if (db) {
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, profile, { merge: true });
    } catch (dbErr) {
      console.warn('[Firebase] Firestore profile write optional fallback:', dbErr);
    }
  }

  return { user, profile };
}

/**
 * Sign in existing user with Email and Password
 */
export async function loginWithEmailAndPassword(
  email: string,
  pass: string
): Promise<{ user: User; profile?: UserProfileData }> {
  if (!auth) {
    throw new Error('Firebase is not configured. Please configure Firebase in your environment or use Guest Mode.');
  }

  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const user = userCredential.user;

  let profile: UserProfileData | undefined = undefined;

  if (db) {
    try {
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        profile = docSnap.data() as UserProfileData;
        await setDoc(userRef, { lastLoginAt: new Date().toISOString() }, { merge: true });
      }
    } catch (err) {
      console.warn('[Firebase] Could not fetch Firestore user profile:', err);
    }
  }

  return { user, profile };
}

/**
 * Send Password Reset Email
 */
export async function sendPasswordReset(email: string): Promise<void> {
  if (!auth) {
    throw new Error('Firebase is not configured.');
  }
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Sign out the current user
 */
export async function logoutUser(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}

/**
 * Map Firebase Auth error codes to user-friendly messages
 */
export function getFirebaseErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'The email address is improperly formatted.';
    case 'auth/user-disabled':
      return 'This account has been disabled by an administrator.';
    case 'auth/user-not-found':
      return 'No VeraCost account exists with this email address.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify your credentials.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters with a combination of letters and numbers.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Access temporarily restricted for your security. Please wait a moment or reset your password.';
    default:
      return 'An error occurred during authentication. Please try again.';
  }
}
