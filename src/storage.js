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

export async function uploadPreviewImage(file, onProgress) {
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
    throw new Error(err.error?.message || `Error ${res.status}`)
  }

  if (onProgress) onProgress(70)
  const data = await res.json()
  if (onProgress) onProgress(100)
  return data.secure_url
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
  try {
    const url = await uploadToCloudinary(file, onProgress)
    return { downloadURL: url, filePath: null, storage: 'cloudinary' }
  } catch (e) {
    console.warn('[Storage] Cloudinary fallback a base64:', e.message)
  }

  if (onProgress) onProgress(50)
  const dataUrl = await fileToBase64(file)
  if (onProgress) onProgress(100)
  return { downloadURL: dataUrl, filePath: null, storage: 'base64' }
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
  try {
    return await uploadToCloudinary(file, onProgress)
  } catch (e) {
    console.warn('[Storage] Cloudinary fallback a base64:', e.message)
  }

  if (onProgress) onProgress(50)
  const dataUrl = await fileToBase64(file)
  if (onProgress) onProgress(100)
  return dataUrl
}
