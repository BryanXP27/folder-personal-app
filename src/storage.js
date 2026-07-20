function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const MAX_SIZE = 700 * 1024

export async function uploadFile(userId, file, onProgress) {
  if (file.size > MAX_SIZE) {
    throw new Error(`Maximo 700KB. ${file.name} pesa ${(file.size / 1024).toFixed(1)}KB`)
  }
  if (onProgress) onProgress(50)
  const dataUrl = await fileToBase64(file)
  if (onProgress) onProgress(100)
  return { downloadURL: dataUrl, filePath: null }
}

export async function deleteStorageFile() {
}

export async function uploadProfilePhoto(userId, file, onProgress) {
  if (file.size > MAX_SIZE) {
    throw new Error(`Maximo 700KB. ${file.name} pesa ${(file.size / 1024).toFixed(1)}KB`)
  }
  if (onProgress) onProgress(50)
  const dataUrl = await fileToBase64(file)
  if (onProgress) onProgress(100)
  return dataUrl
}
