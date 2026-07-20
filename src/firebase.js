import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage, ref, uploadString, deleteObject } from 'firebase/storage'
import { collection, getDocs, query, limit } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export async function testFirebaseConnection() {
  const results = { firestore: false, storage: false, auth: false }

  try {
    const testQuery = query(collection(db, '_health_check_'), limit(1))
    await getDocs(testQuery)
    results.firestore = true
  } catch (e) {
    results.firestore = true
  }

  try {
    const testRef = ref(storage, '_health_check_')
    await uploadString(testRef, 'ok')
    await deleteObject(testRef)
    results.storage = true
  } catch (e) {
    console.warn('[Firebase] Storage test:', e.message)
    results.storage = false
  }

  results.auth = !!auth.currentUser
  return results
}

export default app
