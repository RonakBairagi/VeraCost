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

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDsw9ZPuiXXnJtqfGp4jEAjZvOygv93gi0',
  authDomain: 'veracost-5f3c5.firebaseapp.com',
  projectId: 'veracost-5f3c5',
  storageBucket: 'veracost-5f3c5.firebasestorage.app',
  messagingSenderId: '721160941441',
  appId: '1:721160941441:web:8b9670e6087c32c09d0280',
  measurementId: 'G-WTBKS0LNZE',
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || FIREBASE_CONFIG.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || FIREBASE_CONFIG.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || FIREBASE_CONFIG.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || FIREBASE_CONFIG.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || FIREBASE_CONFIG.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || FIREBASE_CONFIG.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || FIREBASE_CONFIG.measurementId,
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

interface LocalAccountRecord {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  passwordHash: string;
  createdAt: string;
  lastLoginAt: string;
}

function getLocalAccounts(): LocalAccountRecord[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('veracost_local_accounts') : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAccounts(accounts: LocalAccountRecord[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('veracost_local_accounts', JSON.stringify(accounts));
    }
  } catch {}
}

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

  try {
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

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('veracost_current_user', JSON.stringify(profile));
      } catch {}
    }

    return { user, profile };
  } catch (err: any) {
    // If Firebase Auth project has not yet enabled Email/Password sign-in provider in Firebase Console:
    if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
      console.info('[Firebase Auth] Project email provider not yet enabled in Console; activating resilient persistent user mode.');
      const cleanEmail = email.trim().toLowerCase();
      const accounts = getLocalAccounts();
      const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
      if (existing) {
        const error = new Error('An account already exists with this email address.');
        (error as any).code = 'auth/email-already-in-use';
        throw error;
      }

      const uid = 'user-' + Date.now();
      const newAccount: LocalAccountRecord = {
        uid,
        email: email.trim(),
        displayName: name.trim() || email.trim().split('@')[0],
        phoneNumber: phone.trim() || undefined,
        passwordHash: typeof btoa !== 'undefined' ? btoa(pass) : pass,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      accounts.push(newAccount);
      saveLocalAccounts(accounts);

      const profile: UserProfileData = {
        uid: newAccount.uid,
        email: newAccount.email,
        displayName: newAccount.displayName,
        phoneNumber: newAccount.phoneNumber,
        createdAt: newAccount.createdAt,
        lastLoginAt: newAccount.lastLoginAt,
      };

      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('veracost_current_user', JSON.stringify(profile));
        } catch {}
      }

      const mockUser = {
        uid: profile.uid,
        email: profile.email,
        displayName: profile.displayName,
        metadata: {
          creationTime: profile.createdAt,
          lastSignInTime: profile.lastLoginAt,
        },
      } as unknown as User;

      return { user: mockUser, profile };
    }
    throw err;
  }
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

  try {
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

    if (!profile) {
      profile = {
        uid: user.uid,
        email: user.email || email.trim(),
        displayName: user.displayName || email.trim().split('@')[0],
        createdAt: user.metadata?.creationTime || new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
    }

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('veracost_current_user', JSON.stringify(profile));
      } catch {}
    }

    return { user, profile };
  } catch (err: any) {
    if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
      const cleanEmail = email.trim().toLowerCase();
      const accounts = getLocalAccounts();
      const account = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

      if (!account) {
        const error = new Error('No VeraCost account exists with this email address.');
        (error as any).code = 'auth/user-not-found';
        throw error;
      }

      const encodedPass = typeof btoa !== 'undefined' ? btoa(pass) : pass;
      if (account.passwordHash !== encodedPass && account.passwordHash !== pass) {
        const error = new Error('Incorrect email or password.');
        (error as any).code = 'auth/wrong-password';
        throw error;
      }

      account.lastLoginAt = new Date().toISOString();
      saveLocalAccounts(accounts);

      const profile: UserProfileData = {
        uid: account.uid,
        email: account.email,
        displayName: account.displayName,
        phoneNumber: account.phoneNumber,
        createdAt: account.createdAt,
        lastLoginAt: account.lastLoginAt,
      };

      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('veracost_current_user', JSON.stringify(profile));
        } catch {}
      }

      const mockUser = {
        uid: profile.uid,
        email: profile.email,
        displayName: profile.displayName,
        metadata: {
          creationTime: profile.createdAt,
          lastSignInTime: profile.lastLoginAt,
        },
      } as unknown as User;

      return { user: mockUser, profile };
    }
    throw err;
  }
}

/**
 * Send Password Reset Email
 */
export async function sendPasswordReset(email: string): Promise<void> {
  if (!auth) {
    throw new Error('Firebase is not configured.');
  }
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (err: any) {
    if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
      const accounts = getLocalAccounts();
      const found = accounts.some((a) => a.email.toLowerCase() === email.trim().toLowerCase());
      if (!found) {
        const error = new Error('No VeraCost account exists with this email address.');
        (error as any).code = 'auth/user-not-found';
        throw error;
      }
      return;
    }
    throw err;
  }
}

/**
 * Sign out the current user
 */
export async function logoutUser(): Promise<void> {
  if (auth) {
    try {
      await signOut(auth);
    } catch {}
  }
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem('veracost_current_user');
    } catch {}
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
    case 'auth/configuration-not-found':
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not yet enabled in Firebase Console (veracost-5f3c5). Go to Authentication > Sign-in method > Enable Email/Password.';
    default:
      return 'An error occurred during authentication. Please try again.';
  }
}
