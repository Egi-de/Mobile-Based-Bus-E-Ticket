import { initializeApp, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Validate configuration
const validateConfig = () => {
  const requiredKeys = ['apiKey', 'authDomain', 'databaseURL', 'projectId', 'appId', 'storageBucket'];
  const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);
  
  if (missingKeys.length > 0) {
    console.warn(
      `⚠️ Firebase configuration incomplete. Missing: ${missingKeys.join(', ')}\n` +
      'Please update your .env file with Firebase credentials.\n' +
      'Firebase real-time tracking will not work until configured.'
    );
    return false;
  }
  return true;
};

// Initialize Firebase
let app: FirebaseApp | null = null;
let database: Database | null = null;
let storage: FirebaseStorage | null = null;

const isConfigured = validateConfig();

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    storage = getStorage(app);
    console.log('✅ Firebase initialized successfully');
    console.log('📍 Database URL:', firebaseConfig.databaseURL);
    console.log('📦 Storage Bucket:', firebaseConfig.storageBucket);
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
  }
} else {
  console.log('⏭️ Skipping Firebase initialization (not configured)');
}

export { app as firebaseApp, database as firebaseDatabase, storage as firebaseStorage };
export const isFirebaseConfigured = isConfigured;
export { firebaseConfig };
