document.addEventListener('DOMContentLoaded', () => {
    // Referencias al DOM
    const modelViewer = document.getElementById('ar-model');
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const modelNameSpan = document.getElementById('model-name');
    const arButton = document.getElementById('ar-button-trigger');
    const arStatusToast = document.getElementById('ar-status-toast');
    const arStatusText = document.getElementById('ar-status-text');
    const helpModal = document.getElementById('help-modal');
    const helpBtn = document.getElementById('help-btn');
    const closeHelpBtn = document.getElementById('close-help-btn');
    const closeHelpIcon = document.getElementById('close-help');
    const replayContainer = document.getElementById('replay-container');
    const replayBtn = document.getElementById('replay-anim');

    // --- Gestión de Carga de Modelos ---

    function loadModel(file) {
        if (!file) return;

        // Validar tipo de archivo
        const validExtensions = ['glb', 'gltf'];
        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (!validExtensions.includes(fileExtension)) {
            showToast('Error: Por favor sube archivos .glb o .gltf', 'error');
            return;
        }

        const objectURL = URL.createObjectURL(file);
        modelViewer.src = objectURL;
        modelNameSpan.textContent = `Modelo: ${file.name}`;

        // Feedback visual
        showToast('Modelo cargado correctamente. Listo para visualizar.', 'success');
    }

    // Evento Input File
    fileInput.addEventListener('change', (e) => {
        loadModel(e.target.files[0]);
    });

    // Eventos Drag & Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('active');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('active');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('active');
        if (e.dataTransfer.files.length > 0) {
            loadModel(e.dataTransfer.files[0]);
        }
    });

    // --- Lógica AR y UI ---

    // Verificar soporte AR para mostrar/ocultar botón
    modelViewer.addEventListener('ar-status', () => {
        if (!modelViewer.canActivateAR) {
            arButton.style.display = 'none';
            const parent = arButton.parentElement;
            const noArMsg = document.createElement('div');
            noArMsg.className = "text-xs text-red-400 text-center bg-black/80 px-3 py-2 rounded border border-red-900/50";
            noArMsg.textContent = "Tu navegador no soporta WebXR. Usa la vista 3D interactiva.";
            parent.appendChild(noArMsg);
        }
    });

    // Lanzar AR
    arButton.addEventListener('click', () => {
        // Mostrar estado de "Buscando" antes de que el navegador tome el control
        arStatusToast.style.opacity = '1';
        arStatusText.textContent = "Iniciando cámara y buscando superficie...";

        // Llamada nativa a la API de model-viewer
        modelViewer.activateAR().catch((error) => {
            console.error("Error al iniciar AR:", error);
            arStatusText.textContent = "Error al iniciar AR. Revisa la consola.";
            setTimeout(() => { arStatusToast.style.opacity = '0'; }, 3000);
        });
    });

    // --- Barra de Progreso de Carga ---
    const loadBar = document.getElementById('load-bar');
    const loadPct = document.getElementById('load-pct');
    modelViewer.addEventListener('progress', (event) => {
        const pct = Math.round((event.detail.totalProgress || 0) * 100);
        if (loadBar) loadBar.style.width = pct + '%';
        if (loadPct) loadPct.textContent = pct < 100 ? `Cargando modelo… ${pct}%` : 'Preparando escena…';
    });

    // --- Control de Animación ---

    // Reproduce la animación una sola vez (desde el inicio) y oculta el botón de reactivar
    function playAnimationOnce() {
        if (modelViewer.availableAnimations && modelViewer.availableAnimations.length > 0) {
            replayContainer.classList.add('hidden');
            modelViewer.currentTime = 0;
            try {
                modelViewer.play({ repetitions: 1 });
            } catch (e) {
                modelViewer.play();
            }
        }
    }

    // Reactivar animación al hacer clic
    replayBtn.addEventListener('click', playAnimationOnce);

    // Cuando la animación termina, mostrar el botón para reactivarla
    modelViewer.addEventListener('finished', () => {
        if (modelViewer.availableAnimations && modelViewer.availableAnimations.length > 0) {
            replayContainer.classList.remove('hidden');
        }
    });

    // Escuchar eventos del visor para actualizar UI
    modelViewer.addEventListener('load', () => {
        document.getElementById('loading-spinner').style.display = 'none';
        // Arranca la animación una vez (sobre-escribe el bucle de autoplay para poder detectar el final)
        playAnimationOnce();
    });

    // Evento que se dispara cuando la sesión AR cambia de estado
    modelViewer.addEventListener('ar-status', (event) => {
        const status = event.detail.status;
        if (status === 'failed') {
            arStatusText.textContent = "Error: No se pudo detectar superficie o se perdió el seguimiento.";
            setTimeout(() => { arStatusToast.style.opacity = '0'; }, 4000);
        }
    });

    // --- Sistema de Notificaciones (Toast) ---
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 left-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm transition-all duration-500 transform translate-y-10 opacity-0 ${
            type === 'error' ? 'bg-red-900/90 border-red-500 text-red-100' : 'bg-white text-black border-transparent'
        }`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Animación de entrada
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-10', 'opacity-0');
        });

        // Auto-eliminación
        setTimeout(() => {
            toast.classList.add('translate-y-10', 'opacity-0');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    // --- Modal de Ayuda ---
    function toggleHelp(show) {
        if (show) {
            helpModal.classList.remove('hidden');
            helpModal.classList.add('flex');
        } else {
            helpModal.classList.add('hidden');
            helpModal.classList.remove('flex');
        }
    }

    helpBtn.addEventListener('click', () => toggleHelp(true));
    closeHelpBtn.addEventListener('click', () => toggleHelp(false));
    closeHelpIcon.addEventListener('click', () => toggleHelp(false));
    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) toggleHelp(false);
    });
    // Cerrar con tecla Escape (accesibilidad)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && helpModal.classList.contains('flex')) toggleHelp(false);
    });

    // Manejo del estado de carga inicial
    modelViewer.addEventListener('model-visibility', (event) => {
        if (event.detail.visible) {
            document.getElementById('loading-spinner').style.display = 'none';
        }
    });
});
