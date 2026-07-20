// ═══════════════════════════════════════════════════════════════════════════
// FOLDER PERSONAL v3.0 - CLOUD EDITION
// ═══════════════════════════════════════════════════════════════════════════

function showNotification(message, type = 'info') {
    const container = document.getElementById('notifications');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    container.appendChild(notification);

    console.log(`[${type.toUpperCase()}] ${message}`); // Log para debugging

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}


class FolderPersonal {
    constructor() {
        this.items = [];
        this.currentFilter = 'all';
        this.selectedItem = null;
        this.userId = null;
        this.unsubscribe = null; // Para detener el listener de Firestore
        this.initialize();
        this.onConfirm = null;
    }

    async initialize() {
        try {
            console.log('Inicializando Folder Personal v3.0...');
            await this.waitForFirebase();
            this.handleAuthStateChange();
        } catch (error) {
            console.error('Error fatal en la inicialización:', error);
            showNotification('Error al iniciar la aplicación', 'error');
        }
    }

    handleAuthStateChange() {
        const { onAuthStateChanged } = window.firebase_auth_fns;
        onAuthStateChanged(this.auth, (user) => {
            const loginContainer = document.getElementById('loginContainer');
            const mainContainer = document.querySelector('.container');

            if (user) {
                // Usuario ha iniciado sesión
                console.log(`Usuario conectado: ${user.email}`);
                this.userId = user.uid;
                
                loginContainer.classList.add('hidden');
                mainContainer.style.display = 'flex';

                this.setupAppEventListeners();
                this.applyTheme();
                this.loadItemsFromFirestore();
                document.getElementById('userEmail').textContent = user.email;

            } else {
                // Usuario ha cerrado sesión
                console.log('Usuario desconectado.');
                this.userId = null;
                if (this.unsubscribe) this.unsubscribe(); // Detener listener de datos
                this.items = [];
                this.render();

                loginContainer.classList.remove('hidden');
                mainContainer.style.display = 'none';
                this.setupLoginEventListeners();
            }
        });
    }

    waitForFirebase() {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (window.firebaseInitialized) {
                    clearInterval(interval);
                    console.log('✓ Firebase SDK detectado.');
                    // Hacer las funciones de los SDKs más accesibles
                    this.auth = window.firebaseAuth;
                    this.db = window.firebaseDb;
                    this.storage = window.firebaseStorage;
                    resolve();
                }
            }, 100);
        });
    }

    setupLoginEventListeners() {
        const btnLogin = document.getElementById('btnLogin');
        // Usamos .cloneNode para remover listeners antiguos y evitar duplicados
        const newBtnLogin = btnLogin.cloneNode(true);
        btnLogin.parentNode.replaceChild(newBtnLogin, btnLogin);

        newBtnLogin.addEventListener('click', () => this.handleLogin());
    }

    async handleLogin() {
        const { signInWithEmailAndPassword } = window.firebase_auth_fns;
        const email = document.getElementById('emailInput').value;
        const password = document.getElementById('passwordInput').value;
        const errorElement = document.getElementById('loginError');

        if (!email || !password) {
            errorElement.textContent = 'Por favor, ingresa correo y contraseña.';
            return;
        }

        try {
            const { linkWithCredential, EmailAuthProvider } = window.firebase_auth_fns;
            errorElement.textContent = '';

            // 1. Capturamos al usuario actual. Si es anónimo, lo usamos para vincular.
            const currentUser = this.auth.currentUser;

            if (currentUser && currentUser.isAnonymous) {
                // 2. Creamos la credencial para la cuenta permanente.
                const credential = EmailAuthProvider.credential(email, password);
                // 3. Vinculamos la cuenta anónima actual con la nueva credencial.
                await linkWithCredential(currentUser, credential);
                console.log('✓ Cuenta anónima vinculada exitosamente a', email);
            } else {
                // Si no hay usuario anónimo, simplemente iniciamos sesión.
                await signInWithEmailAndPassword(this.auth, email, password);
            }
        } catch (error) {
            console.error('Error de inicio de sesión:', error.code);
            errorElement.textContent = 'Correo o contraseña incorrectos.';
        }
    }

    async handleLogout() {
        const { signOut } = window.firebase_auth_fns;
        await signOut(this.auth);
        // onAuthStateChanged se encargará del resto
    }

    setupAppEventListeners() {
        try {
            console.log('Configurando event listeners...');

            // --- Navegación y Filtros ---
            document.querySelectorAll('.nav-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const navBtn = e.target.closest('.nav-item');
                    if (navBtn) this.filterItems(navBtn);
                });
            });

            // --- Búsqueda ---
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => this.searchItems(e.target.value));
            }

            // --- Botones de Agregar ---
            const btnAdd = document.getElementById('btnAdd');
            const btnEmptyAdd = document.querySelector('.btn-empty-add');
            if (btnAdd) btnAdd.addEventListener('click', () => this.showAddModal());
            if (btnEmptyAdd) btnEmptyAdd.addEventListener('click', () => this.showAddModal());

            // --- Modal de Agregar (Tabs) ---
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.switchTab(e.target));
            });

            // --- Subida de Archivos ---
            const fileInput = document.getElementById('fileInput');
            if (fileInput) {
                fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));
            }

            const uploadZone = document.getElementById('uploadZone');
            if (uploadZone) {
                uploadZone.addEventListener('click', () => {
                    if (fileInput) fileInput.click();
                });
                uploadZone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    uploadZone.classList.add('drag-over');
                });
                uploadZone.addEventListener('dragleave', () => {
                    uploadZone.classList.remove('drag-over');
                });
                uploadZone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    uploadZone.classList.remove('drag-over');
                    this.handleFileSelect(e.dataTransfer.files);
                });
            }

            // --- Agregar Enlace ---
            const btnAddLink = document.getElementById('btnAddLink');
            if (btnAddLink) {
                btnAddLink.addEventListener('click', () => this.addLink());
            }

            // --- Cierre de Modales ---
            document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const modal = e.target.closest('.modal');
                    if (modal) this.closeModal(modal);
                });
            });

            // --- Modal de Detalles ---
            const btnDelete = document.getElementById('btnDelete');
            const btnDownload = document.getElementById('btnDownload');
            if (btnDelete) btnDelete.addEventListener('click', () => this.confirmDelete());
            if (btnDownload) btnDownload.addEventListener('click', () => this.downloadItem());

            // --- Modal de Confirmación (Eliminar) ---
            const btnConfirmDelete = document.getElementById('btnConfirmDelete');
            if (btnConfirmDelete) btnConfirmDelete.addEventListener('click', () => this.onConfirm());

            // --- Modal de Configuración ---
            const btnSettings = document.getElementById('btnSettings');
            if (btnSettings) {
                btnSettings.addEventListener('click', () => this.showSettingsModal());
            }

            // Botones de Tema
            document.querySelectorAll('.theme-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const themeBtn = e.target.closest('.theme-btn');
                    if (themeBtn) this.changeTheme(themeBtn);
                });
            });
            
            // Botón Limpiar Todo
            const btnClearAll = document.getElementById('btnClearAll');
            if (btnClearAll) {
                btnClearAll.addEventListener('click', () => this.confirmClearAll());
            }
            
            // Botón de Logout
            const btnLogout = document.getElementById('btnLogout');
            if (btnLogout) btnLogout.addEventListener('click', () => this.handleLogout());

            // --- Cierre de Modales (Overlay) ---
            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) this.closeModal(modal);
                });
            });

            console.log('✓ Event listeners configurados');
        } catch (error) {
            showNotification('Error al configurar interacciones', 'error');
            console.error('Error en setupAppEventListeners:', error);
        }
    }

    filterItems(btn) {
        try {
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.currentFilter = btn.dataset.filter;
            
            const titles = {
                'all': 'Todos los archivos',
                'document': 'Documentos',
                'image': 'Imágenes',
                'video': 'Videos',
                'link': 'Enlaces'
            };
            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) {
                pageTitle.textContent = titles[this.currentFilter] || 'Archivos';
            }
            this.render();
        } catch (error) {
            console.error('Error en filterItems:', error);
        }
    }

    searchItems(query) {
        try {
            if (!query.trim()) {
                this.render();
                return;
            }
            const filtered = this.items.filter(item => 
                item.name.toLowerCase().includes(query.toLowerCase())
            );
            this.renderItems(filtered);
        } catch (error) {
            console.error('Error en searchItems:', error);
        }
    }

    handleFileSelect(files) {
        if (files.length === 0) return;
        if (!this.userId) {
            showNotification('Error: Usuario no autenticado.', 'error');
            return;
        }

        this.closeModal(document.getElementById('addModal'));

        for (const file of files) {
            const type = this.getFileType(file.type, file.name);
            if (!type) {
                showNotification(`Tipo de archivo no soportado: ${file.name}`, 'error');
                continue;
            }

            this.uploadFile(file, type);
        }
    }

    uploadFile(file, type) {
        const { ref, uploadBytesResumable, getDownloadURL } = window.firebase_storage_fns;
        const { collection, addDoc, serverTimestamp } = window.firebase_firestore_fns;

        const filePath = `${this.userId}/${Date.now()}_${file.name}`;
        const storageRef = ref(this.storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        const progressText = document.getElementById('progressText');
        const progressFill = document.getElementById('progressFill');
        const uploadProgress = document.getElementById('uploadProgress');
        
        if(uploadProgress) uploadProgress.style.display = 'block';

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                if(progressText) progressText.textContent = `Subiendo ${file.name}... ${Math.round(progress)}%`;
                if(progressFill) progressFill.style.width = `${progress}%`;
            },
            (error) => {
                console.error('Error en la subida:', error);
                showNotification(`Error al subir ${file.name}`, 'error');
                if(uploadProgress) uploadProgress.style.display = 'none';
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                    // Guardar metadatos en Firestore
                    const itemsCollection = collection(this.db, 'users', this.userId, 'items');
                    await addDoc(itemsCollection, {
                        name: file.name,
                        type: type,
                        size: this.formatFileSize(file.size),
                        url: downloadURL,
                        path: filePath, // Guardar la ruta para poder borrarlo
                        createdAt: serverTimestamp()
                    });

                    showNotification(`${file.name} subido correctamente`, 'success');
                    if(uploadProgress) uploadProgress.style.display = 'none';
                } catch (error) {
                    console.error('Error al guardar metadatos:', error);
                    showNotification('Error al guardar la información del archivo', 'error');
                }
            }
        );
    }

    loadItemsFromFirestore() {
        const { collection, onSnapshot, query, orderBy } = window.firebase_firestore_fns;
        if (!this.userId) return;

        const itemsCollection = collection(this.db, 'users', this.userId, 'items');
        const q = query(itemsCollection, orderBy('createdAt', 'desc'));

        this.unsubscribe = onSnapshot(q, (snapshot) => {
            this.items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.render();
            this.updateStorageIndicator(); // Ahora se basa en el número de items
            console.log(`✓ ${this.items.length} items cargados desde Firestore.`);
        }, (error) => {
            console.error("Error al cargar items desde Firestore:", error);
            showNotification("No se pudieron cargar los archivos.", "error");
        }
        );
    }

    getFileType(mimeType, fileName) {
        console.log(`Analizando archivo: ${fileName} (MIME: ${mimeType})`);

        // Nivel 1: Extensiones de documentos conocidas (el más fiable)
        const docExtensions = /\.(pdf|doc|docx|docm|xls|xlsx|xlsm|ppt|pptx|pptm|odt|ods|odp|txt|rtf|csv|tsv)$/i;
        if (docExtensions.test(fileName)) { // .test() es más eficiente aquí
            console.log(`✓ Tipo detectado por extensión de documento: document`);
            return 'document';
        }

        // Nivel 2: MIME types específicos y comunes
        if (mimeType) {
            if (mimeType.startsWith('image/')) {
                console.log(`✓ Tipo detectado por MIME: image`);
                return 'image';
            }
            if (mimeType.startsWith('video/')) {
                console.log(`✓ Tipo detectado por MIME: video`);
                return 'video';
            }

            // Nivel 3: Palabras clave en MIME types para documentos
            const mimeKeywords = ['pdf', 'msword', 'wordprocessingml', 'ms-excel', 'spreadsheetml', 'ms-powerpoint', 'presentationml', 'text/plain'];
            if (mimeKeywords.some(keyword => mimeType.includes(keyword))) {
                console.log(`✓ Tipo detectado por palabra clave en MIME: document`);
                return 'document';
            }
        }

        // Nivel 4: Fallback a la extensión para imágenes y video si el MIME es genérico
        const mediaExtensions = /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mkv|mov|avi)$/i;
        if (mediaExtensions.test(fileName)) {
            console.log(`✓ Tipo detectado por extensión de medio (fallback): ${/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName) ? 'image' : 'video'}`);
            return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName) ? 'image' : 'video';
        }

        console.warn(`✗ No se pudo determinar el tipo para: ${fileName} (MIME: ${mimeType})`);
        return null;
    }

    async addLink() {
        const { collection, addDoc, serverTimestamp } = window.firebase_firestore_fns;
        const linkInput = document.getElementById('linkInput');
        const linkTitle = document.getElementById('linkTitle');
        
        const url = linkInput ? linkInput.value.trim() : '';
        let title = linkTitle ? linkTitle.value.trim() : '';

        if (!url) {
            showNotification('Por favor ingresa una URL', 'error');
            return;
        }

        if (!this.userId) {
            showNotification('Error: Usuario no autenticado.', 'error');
            return;
        }

        showNotification('Obteniendo vista previa...', 'info');
        this.closeModal(document.getElementById('addModal'));

        try {
            const ogData = await this.getOpenGraphData(url);
            // El bloque `if (!title && ogData.title)` era un error de sintaxis y no tenía efecto. Se ha eliminado.

            const itemsCollection = collection(this.db, 'users', this.userId, 'items');
            await addDoc(itemsCollection, {
                name: title || ogData.title || url,
                type: 'link',
                url: url,
                image: ogData.image || null,
                description: ogData.description || null,
                createdAt: serverTimestamp()
            });

            console.log(`✓ Enlace agregado: ${title || ogData.title || url}`);
            showNotification(`Enlace agregado`, 'success');

            const linkInput = document.getElementById('linkInput');
            const linkTitleInput = document.getElementById('linkTitle');
            if (linkInput) linkInput.value = '';
            if (linkTitleInput) linkTitleInput.value = '';

        } catch (error) {
            console.error('Error en addLink:', error);
            showNotification('No se pudo obtener la vista previa', 'error');
        }
    }

    getOpenGraphData(url) {
        return fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`) // CORS Proxy
            .then(res => res.json())
            .then(data => {
                const html = data.contents;
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                const ogImage = doc.querySelector('meta[property="og:image"]')?.content;
                const ogDesc = doc.querySelector('meta[property="og:description"]')?.content;
                const ogTitle = doc.querySelector('meta[property="og:title"]')?.content;

                return {
                    image: ogImage || null,
                    description: ogDesc || 'No hay descripción disponible.',
                    title: ogTitle || null
                };
            })
            .catch(err => {
                console.error('Error en getOpenGraphData:', err);
                return { // Devuelve un objeto por defecto en caso de error
                image: null,
                description: 'No se pudo cargar la vista previa.',
                title: null
            }});
    }

    showAddModal() {
        try {
            const addModal = document.getElementById('addModal');
            if (addModal) {
                addModal.classList.add('active');
                const uploadTab = document.querySelector('[data-tab="upload"]');
                if (uploadTab) this.switchTab(uploadTab);
            }
        } catch (error) {
            console.error('Error en showAddModal:', error);
        }
    }

    switchTab(tabBtn) {
        try {
            const modal = tabBtn.closest('.modal');
            if (!modal) return;
            
            modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            modal.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            tabBtn.classList.add('active');
            const tabId = `tab-${tabBtn.dataset.tab}`;
            const tabContent = document.getElementById(tabId);
            if (tabContent) tabContent.classList.add('active');
        } catch (error) {
            console.error('Error en switchTab:', error);
        }
    }

    closeModal(modal) {
        try {
            modal.classList.remove('active');
        } catch (error) {
            console.error('Error en closeModal:', error);
        }
    }

    showSettingsModal() {
        try {
            const settingsModal = document.getElementById('settingsModal');
            if (settingsModal) {
                settingsModal.classList.add('active');
                this.updateStorageIndicator();
            }
        } catch (error) {
            console.error('Error en showSettingsModal:', error);
        }
    }

    changeTheme(btn) {
        try {
            const theme = btn.dataset.theme;
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (theme === 'light') {
                document.body.classList.add('light-theme');
                localStorage.setItem('folderPersonal_theme', 'light');
            } else {
                document.body.classList.remove('light-theme');
                localStorage.setItem('folderPersonal_theme', 'dark');
            }
            console.log(`✓ Tema cambiado a: ${theme}`);
        } catch (error) {
            console.error('Error en changeTheme:', error);
        }
    }

    applyTheme() {
        try {
            const theme = localStorage.getItem('folderPersonal_theme') || 'dark';
            const themeBtn = document.querySelector(`[data-theme="${theme}"]`);
            if (themeBtn) this.changeTheme(themeBtn);
        } catch (error) {
            console.error('Error en applyTheme:', error);
        }
    }

    confirmClearAll() {
        this.showConfirmModal(
            '¿Limpiar todo?',
            '¿Estás seguro? Esto eliminará TODOS tus archivos de la nube de forma permanente.',
            () => this.clearAll()
        );
    }

    async clearAll() {
        showNotification('Eliminando todos los archivos...', 'info');
        try {
            // Crear una copia porque this.items se actualizará en tiempo real
            const itemsToDelete = [...this.items];

            for (const item of itemsToDelete) {
                // No necesitamos esperar cada borrado, pueden ir en paralelo
                this.deleteItemFromFirebase(item);
            }

            // Esperar un poco para que los listeners de onSnapshot actualicen la UI
            setTimeout(() => {
                showNotification('Todos los archivos han sido eliminados.', 'success');
            }, 2000);


            const settingsModal = document.getElementById('settingsModal');
            const confirmModal = document.getElementById('confirmModal');

            if (settingsModal) this.closeModal(settingsModal);
            if (confirmModal) this.closeModal(confirmModal);
            
        } catch (error) {
            console.error('Error en clearAll:', error);
            showNotification('Error: ' + error.message, 'error');
        }
    }

    showConfirmModal(title, message, onConfirm) {
        this.onConfirm = onConfirm;
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmModal').classList.add('active');
    }

    confirmDelete() {
        if (!this.selectedItem) return;
        this.showConfirmModal(
            `Eliminar "${this.selectedItem.name}"`,
            '¿Estás seguro? Esta acción no se puede deshacer.',
            () => this.executeDelete()
        );
    }

    executeDelete() {
        if (!this.selectedItem) return;

        this.deleteItemFromFirebase(this.selectedItem);

        this.closeModal(document.getElementById('viewModal'));
        this.closeModal(document.getElementById('confirmModal'));
    }

    async deleteItemFromFirebase(item) {
        const { doc, deleteDoc } = window.firebase_firestore_fns; // Corregido
        const { ref, deleteObject } = window.firebase_storage_fns; // Corregido

        try {
            // Borrar metadatos de Firestore
            const itemDoc = doc(this.db, 'users', this.userId, 'items', item.id);
            await deleteDoc(itemDoc);

            // Borrar archivo de Storage (solo si no es un enlace)
            if (item.type !== 'link' && item.path) {
                const storageRef = ref(this.storage, item.path);
                await deleteObject(storageRef);
            }

            console.log('✓ Archivo eliminado');
            showNotification('Archivo eliminado', 'success');
        } catch (error) {
            console.error('Error en executeDelete:', error);
            showNotification('Error al eliminar el archivo', 'error');
        }
    }


    render() {
        try {
            const filtered = this.currentFilter === 'all' ? this.items : this.items.filter(item => item.type === this.currentFilter);
            this.renderItems(filtered);
        } catch (error) {
            console.error('Error en render:', error);
        }
    }

    renderItems(items) {
        try {
            const grid = document.getElementById('itemsGrid');
            const empty = document.getElementById('emptyState');

            if (!grid || !empty) return;

            if (items.length === 0) {
                grid.style.display = 'none';
                empty.style.display = 'flex';
                const itemsCount = document.getElementById('itemsCount');
                if (itemsCount) itemsCount.textContent = '0 elementos';
                return;
            }

            grid.style.display = 'grid';
            empty.style.display = 'none';
            const itemsCount = document.getElementById('itemsCount');
            if (itemsCount) {
                itemsCount.textContent = `${items.length} elemento${items.length !== 1 ? 's' : ''}`;
            }

            grid.innerHTML = items.map(item => this.createItemCard(item)).join('');

            grid.querySelectorAll('.item-card').forEach(card => {
                card.addEventListener('click', () => {
                    const id = card.dataset.id;
                    this.showItemDetails(id);
                });
            });
        } catch (error) {
            console.error('Error en renderItems:', error);
        }
    }

    createItemCard(item) {
        let preview = '';
        
        if (item.type === 'image') {
            preview = `<img src="${item.url}" alt="${item.name}" loading="lazy" onerror="this.style.display='none'">`;
        } else if (item.type === 'video') {
            preview = `<video><source src="${item.url}"></video>`;
        } else if (item.type === 'link') {
            preview = item.image
                ? `<img src="${item.image}" alt="${item.name}" style="object-fit: cover;" onerror="this.style.display='none'">`
                : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
        } else {
            preview = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;
        }

        return `
            <div class="item-card" data-id="${item.id}">
                <div class="item-preview">${preview}</div>
                <div class="item-info">
                    <div class="item-title" title="${item.name}">${item.name}</div>
                    <div class="item-meta">
                        <span class="item-type">${item.type}</span>
                        <span class="item-size">${item.size || ''}</span>
                    </div>
                </div>
            </div>
        `;
    }

    showItemDetails(itemId) {
        try {
            this.selectedItem = this.items.find(item => item.id == itemId);
            if (!this.selectedItem) return;

            const modal = document.getElementById('viewModal');
            const title = document.getElementById('viewModalTitle');
            const body = document.getElementById('viewModalBody');
            const btnDownload = document.getElementById('btnDownload');

            if (!modal || !title || !body) return;

            title.textContent = this.selectedItem.name;

            if (this.selectedItem.type === 'image') {
                body.innerHTML = `<div class="view-image"><img src="${this.selectedItem.url}" alt="${this.selectedItem.name}"></div>`;
                if (btnDownload) btnDownload.style.display = 'inline-block';
            } else if (this.selectedItem.type === 'video') {
                body.innerHTML = `<div class.view-video"><video controls style="width: 100%;"><source src="${this.selectedItem.url}"></video></div>`;
                if (btnDownload) btnDownload.style.display = 'inline-block';
            } else if (this.selectedItem.type === 'link') { // Lógica para enlaces
                let linkContent = `
                    <div class="link-preview">
                        ${this.selectedItem.image ? `<img src="${this.selectedItem.image}" class="link-preview-img" onerror="this.style.display='none'">` : ''}
                        <div class="link-preview-content">
                            <div class="link-preview-title">${this.selectedItem.name}</div>
                            <div class="link-preview-desc">${this.selectedItem.description}</div>
                            <a href="${this.selectedItem.url}" target="_blank" class="link-preview-url">${this.selectedItem.url}</a>
                        </div>
                    </div>
                `;
                body.innerHTML = linkContent;
                // El botón "Descargar" para enlaces abrirá la URL
                if (btnDownload) {
                    btnDownload.style.display = 'inline-block';
                }
            } else {
                body.innerHTML = `
                    <div class="view-document">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                        <p>${this.selectedItem.name}</p>
                        <p style="font-size: 12px; color: var(--text-secondary);">${this.selectedItem.size}</p>
                    </div>
                `;
                if (btnDownload) btnDownload.style.display = 'inline-block';
            }

            modal.classList.add('active');
        } catch (error) {
            console.error('Error en showItemDetails:', error);
        }
    }

    async downloadItem() {
        try {
            if (!this.selectedItem) return;

            if (this.selectedItem.type === 'link') {
                window.open(this.selectedItem.url, '_blank');
                return;
            }

            // Para descargar desde una URL de Firebase Storage, es necesario usar fetch y blob
            // ya que las URLs de Firebase tienen tokens de seguridad.
            showNotification('Iniciando descarga...', 'info');
            const response = await fetch(this.selectedItem.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = this.selectedItem.name;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

        } catch (error) {
            console.error('Error en downloadItem:', error);
            showNotification('Error al iniciar la descarga', 'error');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    updateStorageIndicator() {
        try {
            const storageText = document.getElementById('storageText');
            if (storageText) {
                storageText.textContent = `Conectado a la nube. ${this.items.length} elementos.`;
            }
            // La barra de progreso ahora es solo para subidas, no para almacenamiento total.
            // Podríamos calcular el tamaño total si quisiéramos, iterando this.items.
        } catch (error) {
            console.error('Error actualizando el indicador de almacenamiento:', error);
        }
    }
}

// Inicializar app cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== Folder Personal v3.0 - Cloud Edition ===');
    // Inicializar la aplicación principal
    window.folderApp = new FolderPersonal();
});
