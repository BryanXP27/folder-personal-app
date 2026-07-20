import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './firebase.js'

export function uploadFile(userId, file, onProgress) {
  const filePath = `${userId}/${Date.now()}_${file.name}`
  const storageRef = ref(storage, filePath)
  const uploadTask = uploadBytesResumable(storageRef, file)

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        if (onProgress) onProgress(progress)
      },
      (error) => reject(error),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
        resolve({ downloadURL, filePath })
      }
    )
  })
}

export async function deleteStorageFile(filePath) {
  if (!filePath) return
  const storageRef = ref(storage, filePath)
  return deleteObject(storageRef)
}

export async function uploadProfilePhoto(userId, file, onProgress) {
  const filePath = `${userId}/profile/photo.jpg`
  const storageRef = ref(storage, filePath)
  const uploadTask = uploadBytesResumable(storageRef, file)

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        if (onProgress) onProgress(progress)
      },
      (error) => reject(error),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
        resolve(downloadURL)
      }
    )
  })
}
