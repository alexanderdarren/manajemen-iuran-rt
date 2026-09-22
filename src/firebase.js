/**
 * firebase.js
 * Inisialisasi Firebase SDK (modular v9+).
 * Konfigurasi dibaca dari environment variable (VITE_FIREBASE_*).
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Cek apakah variabel Firebase sudah diisi dengan benar.
 */
export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey.trim() !== '' &&
    firebaseConfig.projectId.trim() !== ''
  );
}

let app = null;
let db = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (error) {
    console.error('Error saat inisialisasi Firebase:', error);
  }
} else {
  console.warn(
    '⚠️ Firebase belum dikonfigurasi. Harap isi variabel VITE_FIREBASE_* pada file .env.'
  );
}

export { app, db };
