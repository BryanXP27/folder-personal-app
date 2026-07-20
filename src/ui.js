export function showNotification(message, type = 'info') {
  const container = document.getElementById('notifications')
  if (!container) return

  const el = document.createElement('div')
  el.className = `notification ${type}`
  el.textContent = message
  container.appendChild(el)

  setTimeout(() => {
    el.style.opacity = '0'
    setTimeout(() => el.remove(), 300)
  }, 5000)
}

export function closeModal(modal) {
  if (modal) modal.classList.remove('active')
}

export function openModal(modal) {
  if (modal) modal.classList.add('active')
}

export function applyTheme(theme) {
  const btn = document.querySelector(`[data-theme="${theme}"]`)
  if (btn) {
    document.querySelectorAll('.theme-btn').forEach((b) => b.classList.remove('active'))
    btn.classList.add('active')
  }
  if (theme === 'light') {
    document.body.classList.add('light-theme')
  } else {
    document.body.classList.remove('light-theme')
  }
  localStorage.setItem('folderPersonal_theme', theme)
}

export function getSavedTheme() {
  return localStorage.getItem('folderPersonal_theme') || 'dark'
}

export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileType(mimeType, fileName) {
  const docExtensions =
    /\.(pdf|doc|docx|docm|xls|xlsx|xlsm|ppt|pptx|pptm|odt|ods|odp|txt|rtf|csv|tsv)$/i
  if (docExtensions.test(fileName)) return 'document'

  if (mimeType) {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    const mimeKeywords = [
      'pdf',
      'msword',
      'wordprocessingml',
      'ms-excel',
      'spreadsheetml',
      'ms-powerpoint',
      'presentationml',
      'text/plain',
    ]
    if (mimeKeywords.some((kw) => mimeType.includes(kw))) return 'document'
  }

  const mediaExtensions = /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mkv|mov|avi)$/i
  if (mediaExtensions.test(fileName)) {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName) ? 'image' : 'video'
  }

  return null
}
