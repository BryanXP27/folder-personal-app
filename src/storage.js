import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './firebase.js'

const CLOUD_NAME = 'mhwzmz5m'
const UPLOAD_PRESET = 'folder_personal'

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function uploadToCloudinary(file, onProgress) {
  if (onProgress) onProgress(10)
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Cloudinary error ${res.status}`)
  }

  if (onProgress) onProgress(70)
  const data = await res.json()
  if (onProgress) onProgress(100)
  return data.secure_url
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
    return { downloadURL, filePath, storage: 'firebase' }
  } catch (e) {
    console.warn('[Storage] Firebase fallback a Cloudinary:', e.message)
    try {
      const url = await uploadToCloudinary(file, onProgress)
      return { downloadURL: url, filePath: null, storage: 'cloudinary' }
    } catch (e2) {
      console.warn('[Storage] Cloudinary fallback a base64:', e2.message)
      if (onProgress) onProgress(50)
      const dataUrl = await fileToBase64(file)
      if (onProgress) onProgress(100)
      return { downloadURL: dataUrl, filePath: null, storage: 'base64' }
    }
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
    return await new Promise((resolve, reject) => {
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
  } catch (e) {
    console.warn('[Storage] Firebase fallback a Cloudinary:', e.message)
    try {
      return await uploadToCloudinary(file, onProgress)
    } catch (e2) {
      console.warn('[Storage] Cloudinary fallback a base64:', e2.message)
      if (onProgress) onProgress(50)
      const dataUrl = await fileToBase64(file)
      if (onProgress) onProgress(100)
      return dataUrl
    }
  }
}
