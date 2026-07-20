# 📁 Folder Personal - Gestor de Archivos

Una aplicación web moderna y futurista para guardar y organizar tus archivos, imágenes, videos y enlaces directamente en tu navegador.

## ✨ Características

- 📤 **Subida de archivos** - Arrastra y suelta o selecciona archivos
- 🖼️ **Visualización de imágenes** - Previsualización en tiempo real
- 🎬 **Videos** - Reproductor integrado
- 📎 **Enlaces** - Captura automática de vista previa (OG image)
- 🔍 **Búsqueda** - Busca por nombre al instante
- 🏷️ **Filtros** - Todos, Documentos, Imágenes, Videos, Enlaces
- 🌙 **Tema oscuro/claro** - Cambia entre modos
- 💾 **Almacenamiento local** - Todo guardado en tu navegador
- 🔒 **Privacidad** - 100% local, sin servidores

## 🚀 Inicio Rápido

1. Abre `index.html` en tu navegador
2. Haz clic en **"Agregar"** para subir archivos o enlaces
3. Haz clic en un archivo para verlo en detalle
4. Presiona **"Eliminar"** para borrar

## 📋 Formatos Soportados

### Imágenes
- JPG, PNG, GIF, WEBP, SVG

### Videos
- MP4, MKV, WEBM, AVI, MOV

### Documentos
- PDF, DOC, DOCX, TXT, XLS, XLSX

## 🎯 Funciones Principales

### 1. Subir Archivos
```
Agregar → Subir archivo → Arrastra o haz clic
```

### 2. Eliminar Archivos
```
Click en archivo → Eliminar → Confirmar en modal
```

### 3. Agregar Enlaces
```
Agregar → Agregar enlace → Pega URL → Confirmar
```
La aplicación descargará automáticamente:
- Imagen de vista previa
- Título
- Descripción

### 4. Filtrar
```
Usa los botones en la barra lateral
Todos | Documentos | Imágenes | Videos | Enlaces
```

### 5. Buscar
```
Usa la barra de búsqueda
Busca por nombre (insensible a mayúsculas)
```

## 💾 Almacenamiento

- **Capacidad**: ~50 MB por navegador
- **Tipo**: LocalStorage + IndexedDB
- **Persistencia**: Permanente (hasta limpiar caché)
- **Privacidad**: 100% local, no se sube a servidores

## 🛠️ Configuración

Haz clic en el ícono de configuración (engranaje) para:
- Ver espacio usado
- Cambiar tema (claro/oscuro)
- Limpiar todo (con confirmación)

## 📊 Estado de Funciones

| Función | Estado |
|---------|--------|
| Subida de archivos | ✅ Funciona |
| Eliminación | ✅ Funciona |
| Filtros | ✅ Funciona |
| Búsqueda | ✅ Funciona |
| Enlaces + Vista previa | ✅ Funciona |
| Temas | ✅ Funciona |
| Almacenamiento | ✅ Funciona |

## ⚠️ Notas Importantes

- Los archivos se guardan **SOLO** en tu navegador
- Si limpias el caché, se pierden los archivos
- No funciona entre navegadores (cada uno tiene su propio almacenamiento)
- No requiere conexión a internet (excepto para descargar vistas previas de enlaces)

## 🎨 Diseño

- Interfaz futurista con gradientes
- Colores: Cyan, Morado, Naranja
- Tema oscuro/claro
- Completamente responsive
- Animaciones suaves

## 📱 Compatibilidad

- Chrome/Chromium ✅
- Firefox ✅
- Safari ✅
- Edge ✅

## 🔧 Tecnologías

- HTML5
- CSS3 (Grid, Flexbox, Gradients)
- Vanilla JavaScript (sin frameworks)
- LocalStorage
- FileReader API

## 📝 Archivos del Proyecto

```
.
├── index.html                 # Estructura HTML
├── styles.css                 # Estilos CSS
├── script.js                  # Lógica JavaScript
└── ANALISIS_COMPLETO.txt      # Análisis de problemas
```

## 🐛 Solución de Problemas

### No veo la aplicación
- Asegúrate de abrir `index.html` en el navegador
- Recarga la página (Ctrl+R o Cmd+R)

### No puedo subir archivos
- Verifica que el formato sea soportado
- Comprueba que tienes espacio (menos de 50 MB)
- Abre la consola para ver errores (F12)

### Los archivos desaparecieron
- Probablemente limpiaste el caché del navegador
- Los datos se guardan localmente, no en la nube
- Para no perderlos, usa "Exportar" (próxima actualización)

### Eliminar no funciona
- Abre la consola del navegador (F12)
- Verifica que haya mensajes de error
- Intenta recargar la página

## 🚀 Mejoras Futuras

- [ ] Exportar/Importar (JSON backup)
- [ ] Carpetas/Categorías personalizadas
- [ ] Ordenamiento por nombre, fecha, tamaño
- [ ] Vista previa de PDFs
- [ ] Compresión de imágenes
- [ ] Compartir archivos con URL temporal
- [ ] Sincronización con Google Drive/OneDrive

## 📄 Licencia

Libre para usar, modificar y distribuir

## 👤 Autor

Creado con ❤️ para tu productividad

---

**¿Preguntas o sugerencias?** Revisa la consola del navegador para logs detallados.
