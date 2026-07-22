/*
 * Analítica de MIES-AR (Google Analytics 4).
 * Para ACTIVARLA: crea una propiedad GA4 y pega aquí su "Measurement ID" (empieza por G-).
 * Mientras el ID sea el de ejemplo (G-XXXXXXXXXX), no se carga nada (sin errores).
 *
 * Eventos que registra:
 *   - page_view        (automático)
 *   - model_view       { modelo }   -> se ve un modelo en el visor
 *   - ar_launch        { modelo }   -> se pulsa "Ver en tu espacio"
 *   - qr_open          { modelo }   -> se entra por un QR (?modelo=)
 *   - marker_ar_open               -> se abre la AR de marcador
 *   - marker_scan      { modelo }   -> se detecta una tarjeta (marcador)
 */
(function () {
  var GA_ID = 'G-XXXXXXXXXX'; // <-- REEMPLAZAR por el ID de GA4 del cliente

  window.miesTrack = function () {}; // no-op por defecto
  if (!GA_ID || GA_ID.indexOf('XXXX') !== -1) return;

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', GA_ID);

  window.miesTrack = function (name, params) {
    try { gtag('event', name, params || {}); } catch (e) {}
  };
})();