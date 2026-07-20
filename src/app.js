import { onAuth, login, logout } from './auth.js'

const PORTFOLIO_UID = '2yfOh8VB1cPSbEfFnRSfdzDR6eh2'
import {
  subscribeItems,
  subscribeFolders,
  subscribeProfile,
  addItem,
  deleteItem,
  addFolder,
  removeFolder,
  updateItem,
  saveProfile,
} from './firestore.js'
import { uploadFile, deleteStorageFile, uploadProfilePhoto, uploadPreviewImage } from './storage.js'
import {
  showNotification,
  closeModal,
  openModal,
  applyTheme,
  getSavedTheme,
  formatFileSize,
  getFileType,
} from './ui.js'

class FolderPersonal {
  constructor() {
    this.items = []
    this.folders = []
    this.profileData = null
    this.currentFilter = 'profile'
    this.currentFolderId = null
    this.selectedItem = null
    this.searchQuery = ''
    this.unsubscribeItems = null
    this.unsubscribeFolders = null
    this.unsubscribeProfile = null
    this.onConfirm = null
    this.pendingPhotoURL = null
    this.isOwner = false
    this.userId = PORTFOLIO_UID

    document.querySelector('.container').style.display = 'flex'
    document.getElementById('loginContainer').classList.add('hidden')

    this.setupLoginListeners()
    this.startApp()

    onAuth((user) => {
      if (user && user.uid === PORTFOLIO_UID) {
        console.log('[Auth] Propietario autenticado:', user.email)
        this.isOwner = true
        this.onOwnerReady()
      } else if (user) {
        console.log('[Auth] Otro usuario:', user.email)
        this.isOwner = false
        this.onVisitorMode()
      } else {
        console.log('[Auth] Visitante')
        this.isOwner = false
        this.onVisitorMode()
      }
    })
  }

  onOwnerReady() {
    document.getElementById('userEmail').textContent = 'brayan@undc.edu.pe'
    document.getElementById('userBadge').textContent = 'brayan@undc.edu.pe'
    document.getElementById('btnLoginHeader').style.display = 'none'
    document.getElementById('btnAdd').style.display = 'flex'
    document.getElementById('btnNewFolder').style.display = 'inline-flex'
    document.getElementById('profileEmail').textContent = 'brayan@undc.edu.pe'
    this.loadProfile()
  }

  onVisitorMode() {
    document.getElementById('btnLoginHeader').style.display = 'inline-flex'
    document.getElementById('btnAdd').style.display = 'none'
    document.getElementById('btnNewFolder').style.display = 'none'
    document.getElementById('profileEmail').textContent = 'cargando...'
  }

  startApp() {
    applyTheme(getSavedTheme())
    this.setupAppListeners()
    this.loadData()
    this.showProfileView()
    this.loadProfile()
    console.log('[App] Portafolio publico cargado')
  }

  showProfileView() {
    this.currentFilter = 'profile'
    this.currentFolderId = null
    document.getElementById('itemsGrid').style.display = 'none'
    document.getElementById('emptyState').style.display = 'none'
    document.getElementById('profileView').style.display = 'block'
    document.getElementById('pageTitle').textContent = 'Perfil del Usuario'
    document.getElementById('itemsCount').style.display = 'none'
    document.getElementById('btnAdd').style.display = 'none'
    document.querySelectorAll('.nav-item').forEach((b) => b.classList.remove('active'))
    const profileBtn = document.querySelector('[data-filter="profile"]')
    if (profileBtn) profileBtn.classList.add('active')
    document.getElementById('btnEditProfile').style.display = this.isOwner ? 'inline-block' : 'none'
  }

  loadData() {
    this.unsubscribeItems = subscribeItems(
      this.userId,
      (snapshot) => {
        this.items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        this.render()
        this.updateStorageIndicator()
      },
      (err) => {
        console.error('Error loading items:', err)
        showNotification('Error al cargar archivos', 'error')
      }
    )
    this.unsubscribeFolders = subscribeFolders(
      this.userId,
      (snapshot) => {
        this.folders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        this.renderFolderTree()
        this.render()
      },
      (err) => console.error('Error loading folders:', err)
    )
  }

  loadProfile() {
    this.unsubscribeProfile = subscribeProfile(this.userId, (data) => {
      this.profileData = data || {}
      this.renderProfile()
    })
  }

  renderProfile() {
    const d = this.profileData || {}
    const setText = (id, fallback) => {
      const el = document.getElementById(id)
      if (el) el.textContent = d[id.replace('profile', '').toLowerCase()] || fallback
    }

    document.getElementById('profileName').textContent = d.name || 'Nombre Apellido'
    document.getElementById('profileCareer').textContent = d.career || 'Carrera Profesional'
    document.getElementById('profileEmail').textContent = getUser()?.email || 'cargando...'
    document.getElementById('profilePhone').textContent = d.phone || 'No especificado'
    document.getElementById('profileCycle').textContent = d.cycle || 'No especificado'
    document.getElementById('profileCourse').textContent = d.course || 'No especificado'

    const avatar = document.getElementById('profileAvatar')
    if (d.photoURL) {
      avatar.src = d.photoURL
    } else {
      avatar.src = `https://i.pravatar.cc/150?u=${this.userId}`
    }
  }

  setupLoginListeners() {
    const btn = document.getElementById('btnLogin')
    const clone = btn.cloneNode(true)
    btn.parentNode.replaceChild(clone, btn)
    clone.addEventListener('click', () => this.handleLogin())

    document.getElementById('btnLoginHeader')?.addEventListener('click', () => {
      openModal(document.getElementById('loginModal'))
    })
  }

  async handleLogin() {
    const email = document.getElementById('emailInput').value
    const password = document.getElementById('passwordInput').value
    const errEl = document.getElementById('loginError')
    if (!email || !password) {
      errEl.textContent = 'Ingresa correo y contraseña.'
      return
    }
    try {
      errEl.textContent = ''
      await login(email, password)
      closeModal(document.getElementById('loginModal'))
    } catch {
      errEl.textContent = 'Correo o contraseña incorrectos.'
    }
  }

  setupAppListeners() {
    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const b = e.target.closest('.nav-item')
        if (b) this.filterItems(b)
      })
    })

    document.getElementById('searchInput')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim()
      this.render()
    })

    document.getElementById('btnAdd')?.addEventListener('click', () => this.showAddModal())
    document.querySelector('.btn-empty-add')?.addEventListener('click', () => this.showAddModal())
    document.getElementById('btnNewFolder')?.addEventListener('click', () => this.promptNewFolder())

    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.closest('.tab-btn')))
    })

    const fileInput = document.getElementById('fileInput')
    const uploadZone = document.getElementById('uploadZone')
    fileInput?.addEventListener('change', (e) => this.handleFileSelect(e.target.files))
    uploadZone?.addEventListener('click', () => fileInput?.click())
    uploadZone?.addEventListener('dragover', (e) => {
      e.preventDefault()
      uploadZone.classList.add('drag-over')
    })
    uploadZone?.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'))
    uploadZone?.addEventListener('drop', (e) => {
      e.preventDefault()
      uploadZone.classList.remove('drag-over')
      this.handleFileSelect(e.dataTransfer.files)
    })

    document.getElementById('btnAddLink')?.addEventListener('click', () => this.addLink())

    document.querySelectorAll('.modal-close').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        closeModal(e.target.closest('.modal'))
      })
    })

    document.getElementById('btnDelete')?.addEventListener('click', () => this.confirmDelete())
    document.getElementById('btnDownload')?.addEventListener('click', () => this.downloadItem())
    document.getElementById('btnEditItem')?.addEventListener('click', () => this.openEditItem())
    document.getElementById('btnSaveEditItem')?.addEventListener('click', () => this.saveEditItem())
    document.getElementById('btnCancelEditItem')?.addEventListener('click', () => {
      closeModal(document.getElementById('editItemModal'))
    })
    document.getElementById('btnConfirmDelete')?.addEventListener('click', () => {
      if (this.onConfirm) this.onConfirm()
    })
    document.getElementById('btnConfirmCancel')?.addEventListener('click', () => {
      closeModal(document.getElementById('confirmModal'))
    })

    document.getElementById('btnSettings')?.addEventListener('click', () => {
      openModal(document.getElementById('settingsModal'))
      this.updateStorageIndicator()
    })
    document.getElementById('btnLogout')?.addEventListener('click', () => logout())
    document.getElementById('btnClearAll')?.addEventListener('click', () => this.confirmClearAll())

    document.querySelectorAll('.theme-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const b = e.target.closest('.theme-btn')
        if (b) applyTheme(b.dataset.theme)
      })
    })

    document.querySelectorAll('.modal').forEach((modal) => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal)
      })
    })

    document.getElementById('btnEditProfile')?.addEventListener('click', () => this.openEditProfile())
    document.getElementById('btnSaveProfile')?.addEventListener('click', () => this.saveProfileData())
    document.getElementById('btnCancelEdit')?.addEventListener('click', () => {
      closeModal(document.getElementById('editProfileModal'))
    })
    document.getElementById('btnChangePhoto')?.addEventListener('click', () => {
      document.getElementById('profilePhotoInput')?.click()
    })
    document.getElementById('linkPreviewUrl')?.addEventListener('input', (e) => {
      const img = document.getElementById('linkPreviewImg')
      const val = e.target.value.trim()
      if (val) {
        img.src = val
        img.style.display = 'block'
      } else {
        img.style.display = 'none'
      }
    })
    document.getElementById('btnUploadLinkPreview')?.addEventListener('click', () => {
      document.getElementById('linkPreviewFileInput')?.click()
    })
    document.getElementById('linkPreviewFileInput')?.addEventListener('change', (e) => {
      if (e.target.files.length) this.handleLinkPreviewUpload(e.target.files[0])
    })
    document.getElementById('btnUploadEditPreview')?.addEventListener('click', () => {
      document.getElementById('editPreviewFileInput')?.click()
    })
    document.getElementById('editPreviewFileInput')?.addEventListener('change', (e) => {
      if (e.target.files.length) this.handleEditPreviewUpload(e.target.files[0])
    })
    document.getElementById('editItemPreview')?.addEventListener('input', (e) => {
      const img = document.getElementById('editItemPreviewImg')
      const val = e.target.value.trim()
      if (val) {
        img.src = val
        img.style.display = 'block'
      } else {
        img.style.display = 'none'
      }
    })
    document.getElementById('profilePhotoInput')?.addEventListener('change', (e) => {
      if (e.target.files.length) this.handleProfilePhoto(e.target.files[0])
    })
  }

  filterItems(btn) {
    document.querySelectorAll('.nav-item').forEach((b) => b.classList.remove('active'))
    btn.classList.add('active')
    this.currentFilter = btn.dataset.filter
    const titles = {
      profile: 'Perfil del Usuario',
      document: 'Documentos',
      image: 'Imágenes',
      video: 'Videos',
      link: 'Enlaces',
    }
    const el = document.getElementById('pageTitle')
    if (el) el.textContent = titles[this.currentFilter] || 'Archivos'

    if (this.currentFilter === 'profile') {
      this.currentFolderId = null
      document.getElementById('itemsGrid').style.display = 'none'
      document.getElementById('emptyState').style.display = 'none'
      document.getElementById('profileView').style.display = 'block'
      document.getElementById('itemsCount').style.display = 'none'
      document.getElementById('btnAdd').style.display = 'none'
    } else {
      this.currentFolderId = null
      document.getElementById('itemsGrid').style.display = 'grid'
      document.getElementById('profileView').style.display = 'none'
      document.getElementById('itemsCount').style.display = 'block'
      document.getElementById('btnAdd').style.display = 'flex'
      this.render()
    }
  }

  navigateToFolder(folderId) {
    this.currentFolderId = folderId
    this.renderFolderTree()
    this.updateBreadcrumb()
    this.render()
  }

  getFolderPath() {
    const path = []
    let current = this.folders.find((f) => f.id === this.currentFolderId)
    while (current) {
      path.unshift(current)
      current = this.folders.find((f) => f.id === current.parentId)
    }
    return path
  }

  updateBreadcrumb() {
    const el = document.getElementById('breadcrumb')
    if (!el) return
    const path = this.getFolderPath()
    el.innerHTML = ''
    const rootBtn = document.createElement('button')
    rootBtn.className = `breadcrumb-item${this.currentFolderId ? '' : ' active'}`
    rootBtn.textContent = 'Raíz'
    rootBtn.addEventListener('click', () => this.navigateToFolder(null))
    el.appendChild(rootBtn)
    path.forEach((folder, i) => {
      const isLast = i === path.length - 1
      const sep = document.createElement('span')
      sep.className = 'breadcrumb-sep'
      sep.textContent = '›'
      el.appendChild(sep)
      const btn = document.createElement('button')
      btn.className = `breadcrumb-item${isLast ? ' active' : ''}`
      btn.textContent = folder.name
      if (!isLast) btn.addEventListener('click', () => this.navigateToFolder(folder.id))
      el.appendChild(btn)
    })
  }

  renderFolderTree() {
    const el = document.getElementById('folderTree')
    if (!el) return
    el.innerHTML = ''
    const rootItem = document.createElement('div')
    rootItem.className = `folder-tree-item${this.currentFolderId ? '' : ' active'}`
    rootItem.innerHTML = '<span class="folder-icon">📁</span> Raíz'
    rootItem.addEventListener('click', () => this.navigateToFolder(null))
    el.appendChild(rootItem)
    this.folders
      .filter((f) => !f.parentId)
      .forEach((folder) => {
        const div = document.createElement('div')
        div.className = `folder-tree-item${this.currentFolderId === folder.id ? ' active' : ''}`
        div.innerHTML = `<span class="folder-icon">📂</span> ${folder.name}`
        div.addEventListener('click', () => this.navigateToFolder(folder.id))
        el.appendChild(div)
      })
  }

  promptNewFolder() {
    if (!this.isOwner) {
      showNotification('Debes iniciar sesion como propietario.', 'error')
      return
    }
    const name = prompt('Nombre de la nueva carpeta:')
    if (name && name.trim()) {
      addFolder(this.userId, name.trim(), this.currentFolderId)
        .then(() => showNotification(`Carpeta "${name}" creada`, 'success'))
        .catch(() => showNotification('Error al crear carpeta', 'error'))
    }
  }

  render() {
    if (this.currentFilter === 'profile') {
      document.getElementById('itemsGrid').style.display = 'none'
      document.getElementById('emptyState').style.display = 'none'
      document.getElementById('profileView').style.display = 'block'
      document.getElementById('itemsCount').style.display = 'none'
      document.getElementById('btnAdd').style.display = 'none'
      return
    }
    document.getElementById('itemsGrid').style.display = 'grid'
    document.getElementById('profileView').style.display = 'none'
    document.getElementById('itemsCount').style.display = 'block'
    document.getElementById('btnAdd').style.display = 'flex'

    const currentFolders = this.folders.filter(
      (f) => f.parentId === this.currentFolderId
    )
    let filtered = this.items.filter((item) => item.type === this.currentFilter)
    if (this.currentFolderId) {
      filtered = filtered.filter((i) => i.folderId === this.currentFolderId)
    } else {
      filtered = filtered.filter((i) => !i.folderId)
    }
    if (this.searchQuery) {
      filtered = filtered.filter((i) =>
        i.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      )
    }
    this.renderGrid(currentFolders, filtered)
  }

  renderGrid(folders, items) {
    const grid = document.getElementById('itemsGrid')
    const empty = document.getElementById('emptyState')
    if (!grid || !empty) return

    const total = folders.length + items.length
    if (total === 0) {
      grid.style.display = 'none'
      empty.style.display = 'flex'
      document.getElementById('itemsCount').textContent = '0 elementos'
      return
    }
    empty.style.display = 'none'
    document.getElementById('itemsCount').textContent = `${total} elemento${total !== 1 ? 's' : ''}`

    grid.innerHTML =
      folders.map((f) => this.folderCard(f)).join('') +
      items.map((i) => this.itemCard(i)).join('')

    grid.querySelectorAll('.folder-card').forEach((card) => {
      card.addEventListener('click', () => this.navigateToFolder(card.dataset.id))
    })
    grid.querySelectorAll('.item-card').forEach((card) => {
      card.addEventListener('click', () => this.showItemDetails(card.dataset.id))
    })
  }

  folderCard(folder) {
    return `<div class="item-card folder-card" data-id="${folder.id}">
      <div class="item-preview folder-preview">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
      <div class="item-info">
        <div class="item-title" title="${folder.name}">${folder.name}</div>
        <div class="item-meta"><span class="item-type folder-type">Carpeta</span></div>
      </div>
    </div>`
  }

  itemCard(item) {
    let preview = ''
    const itemPreview = item.preview || (item.type === 'link' ? item.image : null)
    if (itemPreview) {
      preview = `<img src="${itemPreview}" alt="${item.name}" loading="lazy" style="object-fit:cover" onerror="this.style.display='none'">`
    } else if (item.type === 'image') {
      preview = `<img src="${item.url}" alt="${item.name}" loading="lazy" onerror="this.style.display='none'">`
    } else if (item.type === 'video') {
      preview = `<video><source src="${item.url}"></video>`
    } else if (item.type === 'link') {
      preview = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`
    } else {
      preview = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`
    }
    return `<div class="item-card" data-id="${item.id}">
      <div class="item-preview">${preview}</div>
      <div class="item-info">
        <div class="item-title" title="${item.name}">${item.name}</div>
        <div class="item-meta">
          <span class="item-type">${item.type}</span>
          <span class="item-size">${item.size || ''}</span>
        </div>
      </div>
    </div>`
  }

  showItemDetails(itemId) {
    this.selectedItem = this.items.find((i) => i.id == itemId)
    if (!this.selectedItem) return

    const modal = document.getElementById('viewModal')
    const title = document.getElementById('viewModalTitle')
    const body = document.getElementById('viewModalBody')
    const btnDownload = document.getElementById('btnDownload')
    const btnEdit = document.getElementById('btnEditItem')
    title.textContent = this.selectedItem.name
    document.getElementById('btnDelete').style.display = this.isOwner ? 'inline-block' : 'none'

    const itemPreview = this.selectedItem.preview || (this.selectedItem.type === 'link' ? this.selectedItem.image : null)

    if (this.selectedItem.type === 'image') {
      body.innerHTML = `<div class="view-image"><img src="${this.selectedItem.url}" alt="${this.selectedItem.name}"></div>`
      btnDownload.style.display = 'inline-block'
    } else if (this.selectedItem.type === 'video') {
      body.innerHTML = `<div class="view-video"><video controls style="width:100%"><source src="${this.selectedItem.url}"></video></div>`
      btnDownload.style.display = 'inline-block'
    } else if (this.selectedItem.type === 'link') {
      body.innerHTML = `<div class="link-preview">${
        itemPreview
          ? `<img src="${itemPreview}" class="link-preview-img" onerror="this.style.display='none'">`
          : ''
      }<div class="link-preview-content"><div class="link-preview-title">${
        this.selectedItem.name
      }</div><div class="link-preview-desc">${
        this.selectedItem.description || 'Sin descripción'
      }</div><a href="${this.selectedItem.url}" target="_blank" class="link-preview-url">${
        this.selectedItem.url
      }</a></div></div>`
      btnDownload.style.display = 'inline-block'
    } else {
      const docPreview = itemPreview
        ? `<img src="${itemPreview}" style="max-width:100%;max-height:300px;object-fit:contain;border-radius:8px" onerror="this.style.display='none'">`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="64" height="64"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`
      body.innerHTML = `<div class="view-document">${docPreview}<p style="margin-top:12px">${this.selectedItem.name}</p><p style="font-size:12px;color:var(--text-secondary)">${this.selectedItem.size}</p></div>`
      btnDownload.style.display = 'inline-block'
    }
    btnEdit.style.display = this.isOwner ? 'inline-block' : 'none'
    openModal(modal)
  }

  handleFileSelect(files) {
    if (!files.length) return
    if (!this.isOwner) {
      showNotification('Debes iniciar sesion como propietario para subir archivos.', 'error')
      return
    }
    const previewUrl = document.getElementById('previewUrl')?.value.trim() || null
    document.getElementById('previewUrl').value = ''
    closeModal(document.getElementById('addModal'))
    for (const file of files) {
      const type = getFileType(file.type, file.name)
      if (!type) {
        showNotification(`Tipo no soportado: ${file.name}`, 'error')
        continue
      }
      this.uploadAndSave(file, type, previewUrl)
    }
  }

  async uploadAndSave(file, type, previewUrl) {
    const progressText = document.getElementById('progressText')
    const progressFill = document.getElementById('progressFill')
    const progressDiv = document.getElementById('uploadProgress')
    if (progressDiv) progressDiv.style.display = 'block'
    try {
      const { downloadURL, filePath } = await uploadFile(this.userId, file, (p) => {
        if (progressText) progressText.textContent = `Subiendo ${file.name}... ${Math.round(p)}%`
        if (progressFill) progressFill.style.width = `${p}%`
      })
      const itemData = {
        name: file.name,
        type,
        size: formatFileSize(file.size),
        url: downloadURL,
        path: filePath,
        folderId: this.currentFolderId,
      }
      if (previewUrl) itemData.preview = previewUrl
      const docRef = await addItem(this.userId, itemData)
      const newItem = {
        id: docRef.id,
        ...itemData,
        createdAt: new Date(),
      }
      this.items.unshift(newItem)
      showNotification(`${file.name} subido correctamente`, 'success')
      if (this.currentFilter === 'profile') {
        const btn = document.querySelector(`[data-filter="${type}"]`)
        if (btn) this.filterItems(btn)
      } else {
        this.render()
      }
    } catch (err) {
      console.error('[Upload] Error:', err)
      const msg =
        err?.code === 'storage/unauthorized'
          ? 'Permiso denegado. Revisa reglas de Storage en Firebase Console.'
          : err?.code === 'storage/canceled'
          ? 'Subida cancelada.'
          : err?.code === 'storage/retry-limit-exceeded'
          ? 'Limite de reintentos excedido. Revisa tu conexion.'
          : `Error al subir ${file.name}: ${err?.message || 'desconocido'}`
      showNotification(msg, 'error')
    }
    if (progressDiv) progressDiv.style.display = 'none'
  }

  async addLink() {
    const linkInput = document.getElementById('linkInput')
    const linkTitleInput = document.getElementById('linkTitle')
    const url = linkInput?.value.trim() || ''
    const customTitle = linkTitleInput?.value.trim() || ''
    if (!url) {
      showNotification('Ingresa una URL', 'error')
      return
    }
    if (!this.isOwner) {
      showNotification('Debes iniciar sesion como propietario para agregar enlaces.', 'error')
      return
    }
    const manualPreview = document.getElementById('linkPreviewUrl')?.value.trim() || null
    showNotification('Obteniendo vista previa...', 'info')
    closeModal(document.getElementById('addModal'))
    const ogData = await this.getOpenGraphData(url)
    try {
      const linkData = {
        name: customTitle || ogData.title || url,
        type: 'link',
        url,
        description: ogData.description || null,
        folderId: this.currentFolderId,
        image: manualPreview || ogData.image || null,
      }
      const docRef = await addItem(this.userId, linkData)
      this.items.unshift({
        id: docRef.id,
        ...linkData,
        createdAt: new Date(),
      })
      showNotification('Enlace agregado', 'success')
      if (this.currentFilter === 'profile') {
        const btn = document.querySelector('[data-filter="link"]')
        if (btn) this.filterItems(btn)
      } else {
        this.render()
      }
      if (linkInput) linkInput.value = ''
      if (linkTitleInput) linkTitleInput.value = ''
      document.getElementById('linkPreviewUrl').value = ''
    } catch {
      showNotification('Error al agregar enlace', 'error')
    }
  }

  async getOpenGraphData(url) {
    const proxies = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    ]
    for (const proxy of proxies) {
      try {
        const res = await fetch(proxy)
        const data = await res.json()
        const html = data.contents || data.body || ''
        const doc = new DOMParser().parseFromString(html, 'text/html')
        const image = doc.querySelector('meta[property="og:image"]')?.content
          || doc.querySelector('meta[name="twitter:image"]')?.content
          || doc.querySelector('link[rel="image_src"]')?.href
          || null
        const description = doc.querySelector('meta[property="og:description"]')?.content
          || doc.querySelector('meta[name="description"]')?.content
          || null
        const title = doc.querySelector('meta[property="og:title"]')?.content
          || doc.querySelector('title')?.textContent
          || null
        return { image, description, title }
      } catch (e) {
        console.warn('[OG] Proxy fallo:', proxy.split('?')[0], e.message)
      }
    }
    showNotification('No se pudo obtener vista previa. Usa el campo "URL de imagen personalizada".', 'info')
    return { image: null, description: null, title: null }
  }

  showAddModal() {
    openModal(document.getElementById('addModal'))
    const tab = document.querySelector('[data-tab="upload"]')
    if (tab) this.switchTab(tab)
  }

  switchTab(tabBtn) {
    if (!tabBtn) return
    const modal = tabBtn.closest('.modal')
    if (!modal) return
    modal.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'))
    modal.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'))
    tabBtn.classList.add('active')
    document.getElementById(`tab-${tabBtn.dataset.tab}`)?.classList.add('active')
  }

  confirmDelete() {
    if (!this.selectedItem) return
    this.showConfirmModal(
      `Eliminar "${this.selectedItem.name}"`,
      '¿Estás seguro? Esta acción no se puede deshacer.',
      () => this.executeDelete()
    )
  }

  executeDelete() {
    if (!this.selectedItem) return
    this.deleteFromFirebase(this.selectedItem)
    closeModal(document.getElementById('viewModal'))
    closeModal(document.getElementById('confirmModal'))
  }

  async deleteFromFirebase(item) {
    try {
      await deleteItem(this.userId, item.id)
      if (item.type !== 'link' && item.path) {
        await deleteStorageFile(item.path)
      }
      showNotification('Archivo eliminado', 'success')
    } catch {
      showNotification('Error al eliminar', 'error')
    }
  }

  confirmClearAll() {
    this.showConfirmModal(
      '¿Limpiar todo?',
      'Esto eliminará TODOS tus archivos de forma permanente.',
      () => this.clearAll()
    )
  }

  async clearAll() {
    showNotification('Eliminando archivos...', 'info')
    const copy = [...this.items]
    for (const item of copy) {
      try {
        await deleteItem(this.userId, item.id)
        if (item.type !== 'link' && item.path) {
          await deleteStorageFile(item.path)
        }
      } catch {}
    }
    setTimeout(() => {
      showNotification('Todos los archivos eliminados', 'success')
      closeModal(document.getElementById('settingsModal'))
      closeModal(document.getElementById('confirmModal'))
    }, 1000)
  }

  showConfirmModal(title, message, onConfirm) {
    this.onConfirm = onConfirm
    document.getElementById('confirmTitle').textContent = title
    document.getElementById('confirmMessage').textContent = message
    openModal(document.getElementById('confirmModal'))
  }

  async downloadItem() {
    if (!this.selectedItem) return
    if (this.selectedItem.type === 'link') {
      window.open(this.selectedItem.url, '_blank')
      return
    }
    if (this.selectedItem.url?.startsWith('data:')) {
      const a = document.createElement('a')
      a.href = this.selectedItem.url
      a.download = this.selectedItem.name
      document.body.appendChild(a)
      a.click()
      a.remove()
      return
    }
    showNotification('Iniciando descarga...', 'info')
    try {
      const res = await fetch(this.selectedItem.url)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = this.selectedItem.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
    } catch {
      showNotification('Error al descargar', 'error')
    }
  }

  updateStorageIndicator() {
    const el = document.getElementById('storageText')
    if (el) el.textContent = `Conectado a la nube. ${this.items.length} elementos.`
  }

  openEditProfile() {
    const d = this.profileData || {}
    document.getElementById('editName').value = d.name || ''
    document.getElementById('editCareer').value = d.career || ''
    document.getElementById('editPhone').value = d.phone || ''
    document.getElementById('editCycle').value = d.cycle || ''
    document.getElementById('editCourse').value = d.course || ''

    const preview = document.getElementById('editProfilePhoto')
    preview.src = d.photoURL || `https://i.pravatar.cc/150?u=${this.userId}`

    this.pendingPhotoURL = null
    openModal(document.getElementById('editProfileModal'))
  }

  async saveProfileData() {
    if (!this.isOwner) {
      showNotification('Debes iniciar sesion como propietario.', 'error')
      return
    }
    const data = {
      name: document.getElementById('editName').value.trim(),
      career: document.getElementById('editCareer').value.trim(),
      phone: document.getElementById('editPhone').value.trim(),
      cycle: document.getElementById('editCycle').value.trim(),
      course: document.getElementById('editCourse').value.trim(),
    }

    if (this.pendingPhotoURL) {
      data.photoURL = this.pendingPhotoURL
    } else if (this.profileData?.photoURL) {
      data.photoURL = this.profileData.photoURL
    }

    try {
      await saveProfile(this.userId, data)
      showNotification('Perfil actualizado', 'success')
      closeModal(document.getElementById('editProfileModal'))
    } catch {
      showNotification('Error al guardar perfil', 'error')
    }
  }

  async handleLinkPreviewUpload(file) {
    if (!file.type.startsWith('image/')) {
      showNotification('Solo se aceptan imagenes', 'error')
      return
    }
    showNotification('Subiendo imagen...', 'info')
    try {
      const url = await uploadPreviewImage(file)
      document.getElementById('linkPreviewUrl').value = url
      const img = document.getElementById('linkPreviewImg')
      img.src = url
      img.style.display = 'block'
      showNotification('Imagen lista como preview', 'success')
    } catch (e) {
      showNotification('Error al subir imagen: ' + e.message, 'error')
    }
  }

  async handleEditPreviewUpload(file) {
    if (!file.type.startsWith('image/')) {
      showNotification('Solo se aceptan imagenes', 'error')
      return
    }
    showNotification('Subiendo imagen...', 'info')
    try {
      const url = await uploadPreviewImage(file)
      document.getElementById('editItemPreview').value = url
      const img = document.getElementById('editItemPreviewImg')
      img.src = url
      img.style.display = 'block'
      showNotification('Imagen lista como preview', 'success')
    } catch (e) {
      showNotification('Error al subir imagen: ' + e.message, 'error')
    }
  }

  openEditItem() {
    if (!this.selectedItem) return
    document.getElementById('editItemTitle').textContent = `Editar: ${this.selectedItem.name}`
    document.getElementById('editItemName').value = this.selectedItem.name
    const previewVal = this.selectedItem.preview || (this.selectedItem.type === 'link' ? this.selectedItem.image : '') || ''
    document.getElementById('editItemPreview').value = previewVal
    const img = document.getElementById('editItemPreviewImg')
    if (previewVal) {
      img.src = previewVal
      img.style.display = 'block'
    } else {
      img.style.display = 'none'
    }
    closeModal(document.getElementById('viewModal'))
    openModal(document.getElementById('editItemModal'))
  }

  async saveEditItem() {
    if (!this.selectedItem) return
    const newName = document.getElementById('editItemName').value.trim()
    const newPreview = document.getElementById('editItemPreview').value.trim() || null
    if (!newName) {
      showNotification('El nombre no puede estar vacio', 'error')
      return
    }
    try {
      await updateItem(this.userId, this.selectedItem.id, { name: newName, preview: newPreview })
      this.selectedItem.name = newName
      this.selectedItem.preview = newPreview
      const item = this.items.find((i) => i.id === this.selectedItem.id)
      if (item) {
        item.name = newName
        item.preview = newPreview
      }
      showNotification('Actualizado', 'success')
      closeModal(document.getElementById('editItemModal'))
      this.render()
    } catch {
      showNotification('Error al actualizar', 'error')
    }
  }

  async handleProfilePhoto(file) {
    if (!this.isOwner) {
      showNotification('Debes iniciar sesion como propietario.', 'error')
      return
    }
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showNotification('Solo se aceptan imágenes', 'error')
      return
    }
    showNotification('Subiendo foto...', 'info')
    try {
      const url = await uploadProfilePhoto(this.userId, file)
      this.pendingPhotoURL = url
      document.getElementById('editProfilePhoto').src = url
      showNotification('Foto lista. Guarda el perfil para confirmar.', 'success')
    } catch {
      showNotification('Error al subir foto', 'error')
    }
  }
}

export default FolderPersonal
