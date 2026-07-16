document.addEventListener('DOMContentLoaded', () => {
    // Referencias al DOM
    const modelViewer = document.getElementById('ar-model');
    const modelNameSpan = document.getElementById('model-name');
    const modelSwitch = document.getElementById('model-switch');
    const arButton = document.getElementById('ar-button-trigger');
    const arStatusToast = document.getElementById('ar-status-toast');
    const arStatusText = document.getElementById('ar-status-text');
    const helpModal = document.getElementById('help-modal');
    const helpBtn = document.getElementById('help-btn');
    const closeHelpBtn = document.getElementById('close-help-btn');
    const closeHelpIcon = document.getElementById('close-help');
    const replayContainer = document.getElementById('replay-container');
    const replayBtn = document.getElementById('replay-anim');
    const panel = document.getElementById('panel');
    const panelScrim = document.getElementById('panel-scrim');
    const openPanelBtn = document.getElementById('open-panel');
    const closePanelBtn = document.getElementById('close-panel');
    const interactionHint = document.getElementById('interaction-hint');

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

    // Lanzar AR (compartido por el botón del hero y el CTA inferior)
    function startAR() {
        // Mostrar estado de "Buscando" antes de que el navegador tome el control
        arStatusToast.style.opacity = '1';
        arStatusText.textContent = "Iniciando cámara y buscando superficie...";

        // Llamada nativa a la API de model-viewer
        modelViewer.activateAR().catch((error) => {
            console.error("Error al iniciar AR:", error);
            arStatusText.textContent = "Error al iniciar AR. Revisa la consola.";
            setTimeout(() => { arStatusToast.style.opacity = '0'; }, 3000);
        });
    }
    arButton.addEventListener('click', startAR);
    const arCta = document.getElementById('ar-cta');
    if (arCta) arCta.addEventListener('click', startAR);

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
        const anims = modelViewer.availableAnimations || [];
        if (anims.length > 0) {
            replayContainer.classList.add('hidden');
            // Fija (como atributo) un clip válido para el modelo actual; sin esto autoplay reproduce en bucle
            const clip = anims.includes(modelViewer.animationName) ? modelViewer.animationName : anims[0];
            modelViewer.setAttribute('animation-name', clip);
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

    // --- Panel lateral (drawer) ---
    function togglePanel(show) {
        panel.classList.toggle('open', show);
        panel.setAttribute('aria-hidden', show ? 'false' : 'true');
        panelScrim.classList.toggle('hidden', !show);
    }
    openPanelBtn.addEventListener('click', () => togglePanel(true));
    closePanelBtn.addEventListener('click', () => togglePanel(false));
    panelScrim.addEventListener('click', () => togglePanel(false));

    // Cerrar con tecla Escape (accesibilidad)
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (helpModal.classList.contains('flex')) toggleHelp(false);
        if (panel.classList.contains('open')) togglePanel(false);
    });

    // --- Pista de interacción: se auto-oculta ---
    function hideHint() { if (interactionHint) interactionHint.classList.add('hint-hidden'); }
    setTimeout(hideHint, 5000);
    document.getElementById('stage').addEventListener('pointerdown', hideHint, { once: true });

    // --- Selector de modelos ---
    function resetLoader() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) spinner.style.display = '';
        if (loadBar) loadBar.style.width = '0%';
        if (loadPct) loadPct.textContent = 'Cargando modelo… 0%';
        replayContainer.classList.add('hidden');
    }
    function setModel(src, name, iosSrc) {
        resetLoader();
        if (iosSrc) modelViewer.setAttribute('ios-src', iosSrc);
        else modelViewer.removeAttribute('ios-src');
        modelViewer.removeAttribute('animation-name');
        modelViewer.src = src;
        modelNameSpan.textContent = name;
        document.querySelectorAll('.model-item').forEach((b) => b.classList.toggle('active', b.dataset.src === src));
        togglePanel(false);
    }
    document.querySelectorAll('.model-item').forEach((btn) => {
        btn.addEventListener('click', () => setModel(btn.dataset.src, btn.dataset.name, btn.dataset.ios || null));
    });

    // Abrir el selector de modelos desde la píldora del nombre (abajo a la izquierda)
    if (modelSwitch) modelSwitch.addEventListener('click', () => togglePanel(true));

    // Manejo del estado de carga inicial
    modelViewer.addEventListener('model-visibility', (event) => {
        if (event.detail.visible) {
            document.getElementById('loading-spinner').style.display = 'none';
        }
    });
});
