<template>
  <div class="tracking-view" ref="trackingContainer">

    <div id="map" class="map-background"></div>

    <div v-if="isLoadingRoute" class="loading-overlay">
      <div class="glass-loader">
        <Loader2Icon :size="32" class="spinner text-blue" />
        <p>Calculando ruta óptima con OSRM...</p>
      </div>
    </div>

    <Transition name="slide-down">
      <div v-if="telemetry.isSpeeding" class="global-alert-banner">
        <div class="alert-glass-pill">
          <AlertCircleIcon :size="20" class="text-red pulse-icon" />
          <div class="alert-text-group">
            <strong>Exceso de velocidad: {{ telemetry.speed }} km/h</strong>
            <span>Unidad {{ telemetry.truckId }} - Riesgo logístico detectado</span>
          </div>
        </div>
      </div>
    </Transition>

    <div class="floating-top-right">
      <button class="btn-glass" @click="toggleFullscreen" title="Pantalla Completa">
        <MaximizeIcon v-if="!isFullscreen" :size="16" />
        <MinimizeIcon v-else :size="16" />
      </button>
      <button class="btn-primary-glass" @click="goBack">
        <LogOutIcon :size="16" /> Salir del Radar
      </button>
    </div>

    <div class="floating-hud">
      <div class="hud-header">
        <div>
          <h3 class="hud-title">Radar Satelital</h3>
          <p class="hud-subtitle">Orden: <strong>{{ orderId }}</strong></p>
        </div>
        <div class="signal-indicator liquid-pill">
          <span class="signal-dot connected"></span>
          <span class="signal-text">Conexión Segura</span>
        </div>
      </div>

      <div class="hud-body">
        <div class="telemetry-grid">
          <div class="metric-card glass-item">
            <div class="metric-icon" :class="{'bg-red-light': telemetry.isSpeeding}">
              <ActivityIcon :size="20" :class="telemetry.isSpeeding ? 'text-red' : 'text-blue'" />
            </div>
            <div class="metric-data">
              <span class="metric-label">Velocidad Actual</span>
              <div class="metric-value" :class="{ 'text-red': telemetry.isSpeeding }">
                {{ telemetry.speed }} <small>km/h</small>
              </div>
            </div>
          </div>

          <div class="metric-card glass-item">
            <div class="metric-icon bg-blue-light"><NavigationIcon :size="20" class="text-blue" /></div>
            <div class="metric-data">
              <span class="metric-label">Unidad Asignada</span>
              <div class="metric-value unit-id">{{ telemetry.truckId }}</div>
            </div>
          </div>
        </div>
      </div>

      <Transition name="fade-up">
        <div v-if="telemetry.isSpeeding" class="hud-alert">
          <AlertTriangleIcon :size="18" class="alert-icon" />
          <div class="alert-msg">
            <strong>Límite Excedido</strong>
            <p>La unidad superó los 80 km/h. Monitoreo en alerta.</p>
          </div>
        </div>
      </Transition>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFullscreen } from '@vueuse/core';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import {
  MaximizeIcon, MinimizeIcon, LogOutIcon, Loader2Icon,
  ActivityIcon, NavigationIcon, AlertTriangleIcon, AlertCircleIcon
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();

const trackingContainer = ref(null);
const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(trackingContainer);
const orderId = route.params.id || 'ORD-002';

const isLoadingRoute = ref(true);

const telemetry = ref({
  truckId: 'VOLVO-FMX-01',
  speed: 65,
  isSpeeding: false
});

let map = null;
let truckMarker = null;
let animationFrameId = null;

// 🚀 Flecha de Navegación
const navArrowSvg = `<svg viewBox="0 0 24 24" fill="#0f172a" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 22l10-4 10 4L12 2z"/></svg>`;

// ==========================================
// MATEMÁTICA: CALCULAR ROTACIÓN (BEARING)
// ==========================================
const calculateBearing = (lat1, lng1, lat2, lng2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);

  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
};

onMounted(async () => {
  // 1. Inicializar Mapa (CartoDB Positron)
  map = L.map('map', { zoomControl: false }).setView([-12.115, -77.045], 14);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  }).addTo(map);
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // 2. 🚀 OBTENER RUTA REAL DESDE OSRM (Gratis)
  // Coordenadas: Barranco -> San Isidro
  const start = '-77.0250,-12.1450'; // Longitud, Latitud
  const end = '-77.0550,-12.0950';

  try {
    const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`);
    const data = await response.json();

    // OSRM devuelve [lng, lat], Leaflet usa [lat, lng]. Los invertimos.
    const routeCoords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);

    isLoadingRoute.value = false;

    // Dibujamos la línea de la ruta en el mapa
    L.polyline(routeCoords, { color: '#3b82f6', weight: 5, opacity: 0.5 }).addTo(map);

    // 3. Crear el Marcador
    const beaconIcon = L.divIcon({
      html: `
        <div class="beacon-wrapper" id="dynamic-beacon">
          <div class="beacon-pulse"></div>
          <div class="beacon-core" id="beacon-arrow">${navArrowSvg}</div>
        </div>
      `,
      className: 'custom-leaflet-beacon',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    truckMarker = L.marker(routeCoords[0], { icon: beaconIcon }).addTo(map);

    // 4. 🚀 ALGORITMO DE NAVEGACIÓN Y ROTACIÓN
    let currentSegment = 0;
    let progress = 0;

    const moveTruck = () => {
      if (currentSegment >= routeCoords.length - 1) {
        currentSegment = 0; progress = 0; // Loop para la demo
      }

      // Velocidad aleatoria
      if (Math.random() > 0.95) {
        telemetry.value.speed = Math.floor(Math.random() * (85 - 65 + 1)) + 65;
        telemetry.value.isSpeeding = telemetry.value.speed > 80;
      }

      // UI Classes
      const beaconEl = document.getElementById('dynamic-beacon');
      if (beaconEl) {
        if (telemetry.value.isSpeeding) beaconEl.classList.add('speeding');
        else beaconEl.classList.remove('speeding');
      }

      // Avance fluido
      const step = (telemetry.value.speed * 0.00008); // Ajuste fino de velocidad
      progress += step;

      if (progress >= 1) {
        progress = 0;
        currentSegment++;
      } else {
        const startNode = routeCoords[currentSegment];
        const endNode = routeCoords[currentSegment + 1];

        // 🚀 Interpolación de posición
        const currentLat = startNode[0] + (endNode[0] - startNode[0]) * progress;
        const currentLng = startNode[1] + (endNode[1] - startNode[1]) * progress;

        // 🚀 Cálculo de Rotación (El camión gira su nariz)
        const bearing = calculateBearing(startNode[0], startNode[1], endNode[0], endNode[1]);
        const arrowEl = document.getElementById('beacon-arrow');
        if (arrowEl) {
          arrowEl.style.transform = `rotate(${bearing}deg)`;
        }

        truckMarker.setLatLng([currentLat, currentLng]);
        map.panTo([currentLat, currentLng], { animate: true, duration: 0.1 });
      }

      animationFrameId = requestAnimationFrame(moveTruck);
    };

    moveTruck();

  } catch (error) {
    console.error("Error al cargar OSRM:", error);
    isLoadingRoute.value = false;
  }
});

const goBack = () => {
  if(isFullscreen.value) toggleFullscreen();
  router.push('/dashboard');
};

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (map) map.remove();
});
</script>

<style scoped>
/* ─── BASE ─── */
.tracking-view { position: relative; width: 100%; height: 100vh; overflow: hidden; font-family: 'Inter', sans-serif;}
.map-background { position: absolute; inset: 0; z-index: 1; }

/* ─── LOADING OVERLAY ─── */
.loading-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.8); backdrop-filter: blur(10px); z-index: 9999; display: flex; align-items: center; justify-content: center;}
.glass-loader { background: white; padding: 20px 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); display: flex; flex-direction: column; align-items: center; gap: 10px;}
.glass-loader p { margin: 0; font-weight: 700; color: #0f172a; font-size: 14px;}
.spinner { animation: spin 1s linear infinite; }

/* ─── ALERTA GLOBAL CENTRADA ─── */
.global-alert-banner {
  position: absolute; top: 24px; left: 50%; transform: translateX(-50%); z-index: 2000;
  display: flex; justify-content: center; width: 100%; pointer-events: none;
}
.alert-glass-pill {
  background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px);
  border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 100px;
  padding: 10px 24px; display: flex; align-items: center; gap: 12px;
  box-shadow: 0 15px 35px rgba(239, 68, 68, 0.2), inset 0 1px 0 white; pointer-events: auto;
}
.alert-text-group { display: flex; flex-direction: column; }
.alert-text-group strong { font-size: 13px; font-weight: 800; color: #ef4444; margin-bottom: 2px;}
.alert-text-group span { font-size: 11px; font-weight: 600; color: #64748b; }
.pulse-icon { animation: iconPulse 1s infinite alternate; }

/* ─── TOP RIGHT ACTIONS ─── */
.floating-top-right { position: absolute; top: 24px; right: 24px; z-index: 1000; display: flex; gap: 12px; }
.btn-glass { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(12px); border: 1px solid white; padding: 10px; border-radius: 12px; color: #334155; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 15px rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: center; }
.btn-glass:hover { background: white; transform: translateY(-2px); color: #0f172a;}
.btn-primary-glass { background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(12px); border: 1px solid rgba(15,23,42,1); padding: 10px 16px; border-radius: 12px; color: white; font-weight: 700; font-size: 12px; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 15px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 8px; }
.btn-primary-glass:hover { background: #000000; transform: translateY(-2px); }

/* ─── HUD LIQUID GLASS (Izquierda) ─── */
.floating-hud {
  position: absolute; top: 24px; left: 24px; z-index: 1000; width: 340px;
  background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 1); border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255,255,255,0.8); overflow: hidden; display: flex; flex-direction: column;
}
.hud-header { padding: 20px; border-bottom: 1px solid rgba(226, 232, 240, 0.6); display: flex; justify-content: space-between; align-items: flex-start; }
.hud-title { margin: 0 0 2px; font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;}
.hud-subtitle { margin: 0; font-size: 12px; color: #64748b; font-weight: 500;}

.liquid-pill { display: flex; align-items: center; gap: 6px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 4px 10px; border-radius: 20px; }
.signal-dot { width: 6px; height: 6px; background: #10B981; border-radius: 50%; animation: blink 1.5s infinite;}
.signal-text { font-size: 9px; font-weight: 700; color: #475569; text-transform: uppercase;}

.hud-body { padding: 20px; }
.telemetry-grid { display: flex; flex-direction: column; gap: 12px; }
.glass-item { display: flex; align-items: center; gap: 14px; background: rgba(255,255,255,0.6); padding: 14px; border-radius: 16px; border: 1px solid rgba(255,255,255,1); box-shadow: 0 4px 10px rgba(0,0,0,0.02);}
.metric-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.bg-blue-light { background: #eff6ff; } .text-blue { color: #3b82f6; }
.bg-red-light { background: #fef2f2; } .text-red { color: #ef4444 !important; }

.metric-data { flex: 1; display: flex; flex-direction: column;}
.metric-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 2px;}
.metric-value { font-size: 22px; font-weight: 800; color: #0f172a; transition: color 0.3s;}
.metric-value small { font-size: 12px; font-weight: 700; color: #94a3b8; }
.unit-id { font-size: 14px; color: #3b82f6; font-weight: 700; }

.hud-alert { background: #fef2f2; padding: 16px 20px; display: flex; align-items: flex-start; gap: 12px; border-top: 1px solid #fee2e2; }
.alert-icon { color: #ef4444; margin-top: 2px; }
.alert-msg strong { font-size: 12px; color: #ef4444; display: block; margin-bottom: 2px; }
.alert-msg p { margin: 0; font-size: 11px; color: #991b1b; line-height: 1.4; font-weight: 500;}

/* ─── BEACON LEAFLET (Flecha de Navegación) ─── */
:deep(.custom-leaflet-beacon) { background: transparent; border: none; }
:deep(.beacon-wrapper) { position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; }
:deep(.beacon-core) {
  position: relative; z-index: 2; width: 30px; height: 30px; background: white;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3); transition: transform 0.1s ease-out, background 0.3s;
}
:deep(.beacon-pulse) {
  position: absolute; z-index: 1; width: 100%; height: 100%;
  background: rgba(59, 130, 246, 0.4); border-radius: 50%;
  animation: radarPulse 2s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
}
:deep(.beacon-wrapper.speeding .beacon-core svg path) { fill: #ef4444; }
:deep(.beacon-wrapper.speeding .beacon-pulse) { background: rgba(239, 68, 68, 0.5); animation-duration: 1s; }

/* ─── ANIMACIONES ─── */
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
@keyframes iconPulse { from { transform: scale(1); } to { transform: scale(1.15); } }
@keyframes radarPulse { 0% { transform: scale(0.8); opacity: 0.8; } 100% { transform: scale(2.5); opacity: 0; } }

.slide-down-enter-active, .slide-down-leave-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-30px) translateX(-50%); }
.fade-up-enter-active, .fade-up-leave-active { transition: all 0.3s ease; }
.fade-up-enter-from, .fade-up-leave-to { opacity: 0; transform: translateY(10px); }

/* ─── RESPONSIVE ─── */
@media (max-width: 768px) {
  .floating-hud { width: calc(100% - 48px); bottom: 24px; top: auto; z-index: 1000; }
  .floating-top-right { flex-direction: column; right: 16px; top: 16px; z-index: 1001; }
  .global-alert-banner { top: 80px; }
  .alert-glass-pill { flex-direction: column; text-align: center; padding: 10px; }
}
</style>