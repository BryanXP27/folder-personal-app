import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth'
import { auth } from './firebase.js'

export function onAuth(callback) {
  return onAuthStateChanged(auth, callback)
}

export async function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function logout() {
  return signOut(auth)
}

export function getUser() {
  return auth.currentUser
}

export { auth }
