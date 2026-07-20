import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './firebase.js'

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function uploadFile(userId, file, onProgress) {
  const filePath = `${userId}/${Date.now()}_${file.name}`
  const storageRef = ref(storage, filePath)
  try {
    const uploadTask = uploadBytesResumable(storageRef, file)
    const downloadURL = await new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          if (onProgress) onProgress(progress)
        },
        (error) => reject(error),
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref)
          resolve(url)
        }
      )
    })
    return { downloadURL, filePath }
  } catch (e) {
    console.warn('[Storage] Fallback a base64:', e.message)
    if (onProgress) onProgress(50)
    const dataUrl = await fileToBase64(file)
    if (onProgress) onProgress(100)
    return { downloadURL: dataUrl, filePath: null }
  }
}

export async function deleteStorageFile(filePath) {
  if (!filePath) return
  try {
    const storageRef = ref(storage, filePath)
    await deleteObject(storageRef)
  } catch (e) {
    console.warn('[Storage] Error al eliminar:', e.message)
  }
}

export async function uploadProfilePhoto(userId, file, onProgress) {
  const filePath = `${userId}/profile/photo.jpg`
  const storageRef = ref(storage, filePath)
  try {
    const uploadTask = uploadBytesResumable(storageRef, file)
    const downloadURL = await new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          if (onProgress) onProgress(progress)
        },
        (error) => reject(error),
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref)
          resolve(url)
        }
      )
    })
    return downloadURL
  } catch (e) {
    console.warn('[Storage] Fallback a base64:', e.message)
    if (onProgress) onProgress(50)
    const dataUrl = await fileToBase64(file)
    if (onProgress) onProgress(100)
    return dataUrl
  }
}
