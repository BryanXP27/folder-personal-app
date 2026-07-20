import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  where,
  serverTimestamp,
  setDoc,
  getDoc,
} from 'firebase/firestore'
import { db } from './firebase.js'

function itemsRef(userId) {
  return collection(db, 'users', userId, 'items')
}

function foldersRef(userId) {
  return collection(db, 'users', userId, 'folders')
}

function itemDoc(userId, itemId) {
  return doc(db, 'users', userId, 'items', itemId)
}

function folderDoc(userId, folderId) {
  return doc(db, 'users', userId, 'folders', folderId)
}

function profileDoc(userId) {
  return doc(db, 'users', userId, 'profile', 'main')
}

export function subscribeItems(userId, onData, onError) {
  const q = query(itemsRef(userId), orderBy('createdAt', 'desc'))
  return onSnapshot(q, onData, onError)
}

export function subscribeFolders(userId, onData, onError) {
  const q = query(foldersRef(userId), orderBy('name', 'asc'))
  return onSnapshot(q, onData, onError)
}

export async function addItem(userId, data) {
  return addDoc(itemsRef(userId), { ...data, createdAt: serverTimestamp() })
}

export async function updateItem(userId, itemId, data) {
  return updateDoc(itemDoc(userId, itemId), data)
}

export async function deleteItem(userId, itemId) {
  return deleteDoc(itemDoc(userId, itemId))
}

export async function addFolder(userId, name, parentId = null) {
  return addDoc(foldersRef(userId), {
    name,
    parentId,
    createdAt: serverTimestamp(),
  })
}

export async function renameFolder(userId, folderId, newName) {
  return updateDoc(folderDoc(userId, folderId), { name: newName })
}

export async function removeFolder(userId, folderId) {
  return deleteDoc(folderDoc(userId, folderId))
}

export async function moveItemsToFolder(userId, itemIds, folderId) {
  const promises = itemIds.map((id) =>
    updateDoc(itemDoc(userId, id), { folderId })
  )
  return Promise.all(promises)
}

export async function getProfile(userId) {
  const snap = await getDoc(profileDoc(userId))
  return snap.exists() ? snap.data() : null
}

export function subscribeProfile(userId, onData) {
  return onSnapshot(profileDoc(userId), (snap) => {
    onData(snap.exists() ? snap.data() : null)
  })
}

export async function saveProfile(userId, data) {
  return setDoc(profileDoc(userId), data, { merge: true })
}

export async function getItemsInFolder(userId, folderId) {
  return new Promise((resolve, reject) => {
    const q = query(
      itemsRef(userId),
      where('folderId', '==', folderId),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        unsub()
        resolve(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      },
      reject
    )
  })
}
