<template>
  <div class="provider-dashboard">
    <div class="header-section">
      <div class="title-group">
        <h2 class="page-title">Monitor de Flota IoT</h2>
        <div class="hardware-badge liquid-pill">
          <span class="pulse-dot"></span> Sensor DUT-E CAN Conectado
        </div>
      </div>
      <div class="header-actions">

        <div class="custom-dropdown-wrapper">
          <div class="liquid-pill dropdown-trigger" @click="showTruckDropdown = true">
            <span>{{ activeTruck.id }} ({{ activeTruck.stateLabel }})</span>
            <ChevronDownIcon :size="14" class="chevron-icon" />
          </div>

          <transition name="pop-up">
            <div v-if="showTruckDropdown" class="liquid-dropdown-menu" @click.stop>
              <div class="menu-header">Selecciona una unidad</div>
              <div
                  v-for="truck in fleetDatabase"
                  :key="truck.id"
                  class="liquid-menu-item"
                  :class="{ 'is-active': selectedTruckId === truck.id }"
                  @click="handleSelectTruck(truck.id)"
              >
                <div class="item-text-group">
                  <span class="item-id">{{ truck.id }}</span>
                  <span class="item-state">{{ truck.stateLabel }}</span>
                </div>
                <div :class="['status-dot-indicator', getStatusColor(truck.state)]"></div>
              </div>
            </div>
          </transition>
        </div>

        <span class="live-indicator liquid-pill" :class="{ 'alert-mode': activeTruck.state === 'ALERTA' }">
          <span class="dot"></span> En Vivo
        </span>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card glass-card">
        <div class="kpi-icon bg-green-light"><DollarSignIcon :size="18" class="text-green" /></div>
        <div class="kpi-data">
          <span class="kpi-label">Ventas Totales</span>
          <h3 class="kpi-value">S/ {{ ventasTotales }}</h3>
        </div>
      </div>
      <div class="kpi-card glass-card">
        <div class="kpi-icon bg-blue-light"><TruckIcon :size="18" class="text-blue" /></div>
        <div class="kpi-data">
          <span class="kpi-label">Flota Activa</span>
          <h3 class="kpi-value">{{ unidadesEnRuta }} / 15</h3>
        </div>
      </div>
      <div class="kpi-card glass-card">
        <div class="kpi-icon bg-orange-light"><AlertCircleIcon :size="18" class="text-orange" /></div>
        <div class="kpi-data">
          <span class="kpi-label">Alertas Críticas</span>
          <h3 class="kpi-value" :class="{ 'text-red': activeTruck.state === 'ALERTA' }">
            {{ activeTruck.state === 'ALERTA' ? '1' : '0' }}
          </h3>
        </div>
      </div>
      <div class="kpi-card glass-card">
        <div class="kpi-icon bg-gray-light"><FuelIcon :size="18" class="text-gray" /></div>
        <div class="kpi-data">
          <span class="kpi-label">Pendientes</span>
          <h3 class="kpi-value">{{ pendingOrdersCount }}</h3>
        </div>
      </div>
    </div>

    <div class="main-content-grid">

      <div class="chart-card glass-card iot-panel" :class="{ 'border-alert': activeTruck.state === 'ALERTA' }">

        <div class="iot-top-bar">
          <div class="iot-title-area">
            <h4>Telemetría en Vivo</h4>
            <span class="sensor-id">SENS-{{ activeTruck.id }}-4K</span>
          </div>

          <div class="iot-horizontal-metrics">
            <div class="metric-pill">
              <FuelIcon :size="14" class="text-blue" />
              <div class="m-data">
                <span class="m-lbl">Volumen Real</span>
                <span class="m-val" :class="{'text-red': activeTruck.state === 'ALERTA'}">{{ currentFuelLevel.toFixed(1) }} L</span>
              </div>
            </div>
            <div class="metric-pill">
              <TrendingUpIcon :size="14" class="text-green" />
              <div class="m-data">
                <span class="m-lbl">Carga Acum.</span>
                <span class="m-val">{{ currentLoad.toFixed(1) }} L</span>
              </div>
            </div>
            <div class="metric-pill">
              <TrendingDownIcon :size="14" class="text-red" />
              <div class="m-data">
                <span class="m-lbl">Descarga Acum.</span>
                <span class="m-val">{{ Math.abs(currentDischarge).toFixed(1) }} L</span>
              </div>
            </div>
          </div>

          <div class="iot-controls">
            <input type="date" v-model="startDate" class="date-input liquid-pill" />
            <input type="date" v-model="endDate" class="date-input liquid-pill" />
            <button class="action-btn btn-filter"><FilterIcon :size="14" /></button>
          </div>
        </div>

        <div class="iot-chart-wrapper">
          <apexchart type="line" height="100%" :options="telemetryOptions" :series="telemetrySeries" />
        </div>

        <div class="vehicle-vital-stats">
          <div class="vital-item">
            <GaugeIcon :size="16" class="v-icon" />
            <div class="v-info"><span class="v-lbl">Velocidad</span><span class="v-val">{{ vehicleStatus.speed }} km/h</span></div>
          </div>
          <div class="vital-item">
            <PowerIcon :size="16" class="v-icon" :class="vehicleStatus.engine === 'Encendido' ? 'text-green' : 'text-gray'" />
            <div class="v-info"><span class="v-lbl">Motor</span><span class="v-val">{{ vehicleStatus.engine }}</span></div>
          </div>
          <div class="vital-item">
            <MapPinIcon :size="16" class="v-icon text-blue" />
            <div class="v-info"><span class="v-lbl">Ubicación GPS</span><span class="v-val">{{ vehicleStatus.location }}</span></div>
          </div>
          <div class="vital-divider"></div>

          <div class="vital-item clickable-driver" @click="showDriverPopover = true">
            <UserIcon :size="16" class="v-icon" />
            <div class="v-info">
              <span class="v-lbl">Conductor (Perfil)</span>
              <span class="v-val underline-effect">{{ activeTruck.driver.name }}</span>
            </div>

            <transition name="pop-up">
              <div v-if="showDriverPopover" class="driver-popover" @click.stop>
                <div class="dp-header">
                  <img :src="activeTruck.driver.photo" alt="Driver" class="dp-avatar">
                  <div class="dp-info">
                    <h5>{{ activeTruck.driver.name }}</h5>
                    <span>Licencia {{ activeTruck.driver.license }} • {{ activeTruck.driver.age }} años</span>
                    <span class="dp-phone">{{ activeTruck.driver.phone }}</span>
                  </div>
                </div>
                <div class="dp-actions">
                  <a :href="'tel:' + activeTruck.driver.phone" class="btn-dp call">
                    <PhoneIcon :size="14" /> Llamar
                  </a>
                  <a :href="'https://wa.me/' + formatWaNumber(activeTruck.driver.phone)" target="_blank" class="btn-dp wa">
                    <MessageCircleIcon :size="14" /> WhatsApp
                  </a>
                </div>
              </div>
            </transition>
          </div>

          <div class="vital-item">
            <BatteryIcon :size="16" class="v-icon" :class="{'text-red': vehicleStatus.battery < 20}" />
            <div class="v-info"><span class="v-lbl">Sensor Bat.</span><span class="v-val">{{ vehicleStatus.battery }}%</span></div>
          </div>
          <div class="vital-item">
            <WifiIcon :size="16" class="v-icon" />
            <div class="v-info"><span class="v-lbl">Señal GSM</span><span class="v-val">{{ vehicleStatus.signal }}</span></div>
          </div>
        </div>
      </div>

      <div class="side-column">

        <div class="chart-card glass-card flex-half">
          <div class="chart-header">
            <h4>Activity Feed</h4>
            <span class="pulse-dot-small" :class="{ 'bg-red-pulse': activeTruck.state === 'ALERTA' }"></span>
          </div>
          <div class="event-log-container" ref="logContainer">
            <transition-group name="list" tag="div" class="event-list">
              <div v-for="(event, index) in eventLog" :key="event.id" class="event-item">
                <div class="e-time">{{ event.time }}</div>
                <div :class="['e-dot', event.type]"></div>
                <div class="e-msg" :class="{'text-red bold': event.type === 'error'}">{{ event.msg }}</div>
              </div>
            </transition-group>
          </div>
        </div>

        <div class="chart-card glass-card flex-half">
          <div class="chart-header">
            <h4>Solicitudes de Despacho</h4>
            <button class="btn-link" @click="router.push('/provider/orders')">Ver todo</button>
          </div>
          <div class="recent-list">
            <div v-for="order in recentOrders" :key="order.id" class="recent-item liquid-item">
              <div class="r-info">
                <span class="r-id">{{ order.id }}</span>
              </div>
              <div class="r-amount">{{ order.gallons.toLocaleString() }} gal</div>
              <span :class="['r-status', order.status.toLowerCase()]">{{ formatStatus(order.status) }}</span>
            </div>
          </div>
        </div>

      </div>
    </div>

    <div v-if="showDriverPopover || showTruckDropdown" class="popover-overlay" @click="closeAllPopovers"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useOrderStore } from '../../application/stores/orderStore.js';
import {
  DollarSignIcon, TruckIcon, AlertCircleIcon, FuelIcon,
  FilterIcon, XIcon, TrendingUpIcon, TrendingDownIcon,
  MapPinIcon, BatteryIcon, WifiIcon, UserIcon, GaugeIcon, PowerIcon,
  PhoneIcon, MessageCircleIcon, ChevronDownIcon
} from 'lucide-vue-next';

const router = useRouter();
const orderStore = useOrderStore();

const startDate = ref('2026-01-19');
const endDate = ref('2026-01-23');

// Control de Popovers
const showDriverPopover = ref(false);
const showTruckDropdown = ref(false);

const closeAllPopovers = () => {
  showDriverPopover.value = false;
  showTruckDropdown.value = false;
};

const formatWaNumber = (phone) => phone.replace(/[^0-9]/g, '');

// ==========================================
// BASE DE DATOS DE CAMIONES
// ==========================================
const fleetDatabase = {
  'VOLVO-01': {
    id: 'VOLVO-01', state: 'EN_RUTA', stateLabel: 'En Ruta (Ida)', baseLocation: 'Panamericana Sur, Km 42', baseFuel: 600,
    driver: { name: 'Carlos Mendoza', age: 42, phone: '+51 987 654 321', license: 'A-IIIc', photo: 'https://i.pravatar.cc/150?u=carlos' }
  },
  'SCANIA-04': {
    id: 'SCANIA-04', state: 'DESCARGANDO', stateLabel: 'Descargando en Mina', baseLocation: 'Mina Yanacocha - Zona B', baseFuel: 500,
    driver: { name: 'Luis Perez', age: 35, phone: '+51 912 345 678', license: 'A-IIIb', photo: 'https://i.pravatar.cc/150?u=luis' }
  },
  'MACK-09': {
    id: 'MACK-09', state: 'EN_PLANTA', stateLabel: 'En Planta (Disponible)', baseLocation: 'Base Central Lima', baseFuel: 150,
    driver: { name: 'Sin Asignar', age: '--', phone: '+51 000 000 000', license: '--', photo: 'https://ui-avatars.com/api/?name=S+A&background=e2e8f0&color=64748b' }
  },
  'MERCEDES-12': {
    id: 'MERCEDES-12', state: 'CARGANDO', stateLabel: 'Cargando en Surtidor', baseLocation: 'Base Central - Surtidor 1', baseFuel: 50,
    driver: { name: 'Operador Planta', age: 29, phone: '+51 955 444 333', license: 'Operario', photo: 'https://i.pravatar.cc/150?u=operador' }
  },
  'HINO-03': {
    id: 'HINO-03', state: 'ALERTA', stateLabel: 'ALERTA - ROBO', baseLocation: 'Ruta Desconocida (Señal Débil)', baseFuel: 800,
    driver: { name: 'Pedro Sanchez', age: 50, phone: '+51 999 888 777', license: 'A-IIIc', photo: 'https://i.pravatar.cc/150?u=pedro' }
  }
};

const selectedTruckId = ref('VOLVO-01');
const activeTruck = computed(() => fleetDatabase[selectedTruckId.value]);

const getStatusColor = (state) => {
  const map = { 'EN_RUTA': 'bg-blue', 'DESCARGANDO': 'bg-orange', 'EN_PLANTA': 'bg-gray', 'CARGANDO': 'bg-green', 'ALERTA': 'bg-red' };
  return map[state] || 'bg-gray';
};

// Lógica del nuevo Dropdown
const handleSelectTruck = (truckId) => {
  selectedTruckId.value = truckId;
  showTruckDropdown.value = false;
  changeTruck(); // Reinicia la simulación para el nuevo camión
};

// ==========================================
// SIMULACIÓN EN VIVO (IOT)
// ==========================================
let simInterval = null;
let eventCounter = 0;

const currentFuelLevel = ref(0);
const currentDischarge = ref(0);
const currentLoad = ref(0);

const vehicleStatus = ref({ speed: 0, engine: 'Apagado', location: '', battery: 100, signal: '4G LTE' });
const eventLog = ref([]);

const telemetrySeries = ref([
  { name: 'Nivel Tanque', type: 'line', data: Array(10).fill(0) },
  { name: 'Carga', type: 'line', data: Array(10).fill(0) },
  { name: 'Descarga', type: 'line', data: Array(10).fill(0) }
]);

const telemetryOptions = ref({
  chart: { toolbar: { show: false }, fontFamily: 'Inter, sans-serif', animations: { enabled: true, easing: 'linear', dynamicAnimation: { speed: 2000 } } },
  colors: ['#3b82f6', '#10b981', '#ef4444'],
  stroke: { curve: ['smooth', 'stepline', 'stepline'], width: [3, 2, 2] },
  xaxis: { labels: { show: false }, tooltip: { enabled: false } },
  yaxis: { min: -200, max: 1000, tickAmount: 4, labels: { style: { colors: '#94a3b8', fontSize: '10px' } } },
  dataLabels: { enabled: false }, grid: { borderColor: '#f1f5f9', strokeDashArray: 4 }, legend: { show: false }
});

const addEvent = (msg, type) => {
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  eventLog.value.unshift({ id: eventCounter++, time, msg, type });
  if (eventLog.value.length > 20) eventLog.value.pop();
};

const changeTruck = () => {
  const truck = activeTruck.value;
  currentFuelLevel.value = truck.baseFuel;
  currentDischarge.value = 0;
  currentLoad.value = truck.state === 'CARGANDO' ? 100 : 0;

  vehicleStatus.value.location = truck.baseLocation;
  vehicleStatus.value.battery = truck.state === 'ALERTA' ? 15 : 98;
  vehicleStatus.value.signal = truck.state === 'ALERTA' ? 'Borde/GPRS' : '4G LTE';

  telemetrySeries.value[0].data = Array(10).fill(truck.baseFuel);
  telemetrySeries.value[1].data = Array(10).fill(currentLoad.value);
  telemetrySeries.value[2].data = Array(10).fill(0);

  eventLog.value = [];
  addEvent(`Conexión establecida con ${truck.id}`, 'success');
  addEvent(`Estado actual: ${truck.stateLabel}`, 'info');
};

const runSimulation = () => {
  const state = activeTruck.value.state;
  switch(state) {
    case 'EN_RUTA':
    case 'RETORNANDO':
      vehicleStatus.value.engine = 'Encendido';
      vehicleStatus.value.speed = Math.floor(Math.random() * 20) + 60;
      currentFuelLevel.value -= (Math.random() * 2 + 1);
      if (Math.random() > 0.8) addEvent('Velocidad estable en ruta', 'info');
      break;
    case 'DESCARGANDO':
      vehicleStatus.value.engine = 'Encendido (TDF)';
      vehicleStatus.value.speed = 0;
      const desc = Math.floor(Math.random() * 20) + 30;
      if (currentFuelLevel.value > desc) {
        currentFuelLevel.value -= desc;
        currentDischarge.value -= desc;
        addEvent(`Descargando ${desc}L a válvula cliente`, 'warning');
      }
      break;
    case 'CARGANDO':
      vehicleStatus.value.engine = 'Apagado';
      vehicleStatus.value.speed = 0;
      const carga = Math.floor(Math.random() * 30) + 40;
      if (currentFuelLevel.value < 1000) {
        currentFuelLevel.value += carga;
        currentLoad.value += carga;
        addEvent(`Inyectando ${carga}L desde matriz`, 'success');
      }
      break;
    case 'ALERTA':
      vehicleStatus.value.engine = 'Bloqueo Remoto';
      vehicleStatus.value.speed = 0;
      vehicleStatus.value.signal = 'Intermitente';
      const robo = Math.floor(Math.random() * 50) + 50;
      if (currentFuelLevel.value > 0) {
        currentFuelLevel.value -= robo;
        currentDischarge.value -= robo;
        addEvent(`¡ALERTA! CAÍDA BRUSCA DE PRESIÓN (-${robo}L)`, 'error');
      }
      break;
  }

  if (currentFuelLevel.value < 0) currentFuelLevel.value = 0;

  telemetrySeries.value = [
    { name: 'Nivel Tanque', type: 'line', data: [...telemetrySeries.value[0].data.slice(1), currentFuelLevel.value] },
    { name: 'Carga', type: 'line', data: [...telemetrySeries.value[1].data.slice(1), currentLoad.value] },
    { name: 'Descarga', type: 'line', data: [...telemetrySeries.value[2].data.slice(1), currentDischarge.value] }
  ];
};

// ==========================================
// RESTO DE LÓGICA
// ==========================================
const ventasTotales = computed(() => {
  const total = orderStore.orders.reduce((sum, order) => sum + ((Number(order.gallons) || 0) * 15.5), 0);
  return total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
});
const unidadesEnRuta = computed(() => orderStore.orders.filter(o => o.status === 'IN_TRANSIT').length);
const pendingOrdersCount = computed(() => orderStore.orders.filter(o => o.status === 'PENDING_APPROVAL').length);
const recentOrders = computed(() => orderStore.orders.slice(0, 4));
const formatStatus = (status) => {
  const map = { 'PENDING_APPROVAL': 'PND', 'APPROVED': 'APR', 'IN_TRANSIT': 'RTA', 'DELIVERED': 'ENT' };
  return map[status] || status;
};

onMounted(() => {
  orderStore.fetchOrders();
  changeTruck();
  simInterval = setInterval(runSimulation, 2500);
});

onUnmounted(() => { if (simInterval) clearInterval(simInterval); });
</script>

<style scoped>
/* ─── BASE ─── */
.provider-dashboard {
  display: flex; flex-direction: column; height: 100vh; max-height: 100%;
  animation: fadeIn 0.4s ease-out; font-family: 'Inter', sans-serif; overflow: hidden;
}

.glass-card {
  background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 1); border-radius: 24px;
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  padding: 20px; display: flex; flex-direction: column; transition: all 0.3s ease;
}

.border-alert { border: 2px solid #ef4444; box-shadow: 0 0 20px rgba(239, 68, 68, 0.2); }

/* Píldoras interactivas */
.liquid-pill {
  background: white; border: 1px solid #e2e8f0; border-radius: 12px;
  padding: 6px 12px; font-size: 12px; font-weight: 600; color: #0f172a;
  box-shadow: 0 2px 6px rgba(0,0,0,0.02); outline: none; transition: 0.2s; cursor: pointer;
}
.liquid-pill:hover { border-color: #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

/* ─── HEADER Y NUEVO DROPDOWN CUSTOM ─── */
.header-section { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; flex-shrink: 0;}
.title-group { display: flex; align-items: center; gap: 16px;}
.page-title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px;}
.hardware-badge { display: flex; align-items: center; gap: 8px; color: #475569; font-size: 11px; cursor: default;}
.pulse-dot, .pulse-dot-small { border-radius: 50%; animation: pulse 2s infinite; }
.pulse-dot { width: 8px; height: 8px; background: #3b82f6; }
.pulse-dot-small { width: 8px; height: 8px; background: #10B981; }
.bg-red-pulse { background: #ef4444 !important; }

.header-actions { display: flex; align-items: center; gap: 12px; position: relative;}

/* Dropdown Liquid Glass */
.custom-dropdown-wrapper { position: relative; }
.dropdown-trigger { display: flex; align-items: center; gap: 8px; justify-content: space-between; min-width: 180px;}
.liquid-dropdown-menu {
  position: absolute; top: calc(100% + 8px); left: 0; width: 240px;
  background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(25px);
  border: 1px solid white; border-radius: 16px; padding: 8px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15); z-index: 100;
}
.menu-header { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; padding: 8px 12px; }
.liquid-menu-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; border-radius: 10px; cursor: pointer; transition: 0.2s;
}
.liquid-menu-item:hover { background: #f8fafc; }
.liquid-menu-item.is-active { background: #eff6ff; }
.item-text-group { display: flex; flex-direction: column; }
.item-id { font-size: 13px; font-weight: 700; color: #0f172a; }
.item-state { font-size: 10px; font-weight: 600; color: #64748b; }
.status-dot-indicator { width: 8px; height: 8px; border-radius: 50%; }

.bg-blue { background: #3b82f6; }
.bg-orange { background: #f59e0b; }
.bg-gray { background: #94a3b8; }
.bg-green { background: #10b981; }
.bg-red { background: #ef4444; }

.live-indicator { display: flex; align-items: center; gap: 6px; color: #10B981; border: none; background: transparent; box-shadow: none; font-weight: 800; cursor: default;}
.alert-mode { color: #ef4444 !important; }
.alert-mode .dot { background: #ef4444 !important; }
.dot { width: 6px; height: 6px; background: #10B981; border-radius: 50%; animation: pulse 2s infinite; }

/* ─── KPIs SUPERIORES ─── */
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; flex-shrink: 0;}
.kpi-card { flex-direction: row; align-items: center; gap: 16px; padding: 16px 20px; }
.kpi-icon { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;}
.bg-green-light { background: #dcfce7; } .text-green { color: #10b981; }
.bg-blue-light { background: #dbeafe; } .text-blue { color: #3b82f6; }
.bg-orange-light { background: #fef3c7; } .text-orange { color: #f59e0b; }
.bg-gray-light { background: #f1f5f9; } .text-gray { color: #64748b; }
.text-red { color: #ef4444; } .bold { font-weight: 800 !important; }

.kpi-data { display: flex; flex-direction: column;}
.kpi-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;}
.kpi-value { font-size: 22px; font-weight: 800; margin: 2px 0 0 0; color: #0f172a; transition: color 0.3s; }

/* ─── MAIN GRID ─── */
.main-content-grid { display: grid; grid-template-columns: 2.3fr 1fr; gap: 20px; flex: 1; min-height: 0;}

/* ─── PANEL IOT (IZQUIERDA) ─── */
.iot-panel { flex: 1; justify-content: space-between; position: relative;}
.iot-top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.iot-title-area h4 { font-size: 16px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0;}
.sensor-id { font-size: 11px; color: #64748b; font-weight: 600; }

.iot-horizontal-metrics { display: flex; gap: 12px; }
.metric-pill { display: flex; align-items: center; gap: 10px; background: #f8fafc; padding: 8px 16px; border-radius: 12px; border: 1px solid #f1f5f9;}
.m-data { display: flex; flex-direction: column; }
.m-lbl { font-size: 10px; font-weight: 600; color: #64748b; }
.m-val { font-size: 14px; font-weight: 800; color: #0f172a; transition: color 0.3s;}

.iot-controls { display: flex; gap: 8px; align-items: center; }
.date-input { width: 110px; cursor: text;}
.action-btn { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: 0.2s;}
.btn-filter { background: #f1f5f9; color: #0f172a; }
.btn-filter:hover { background: #e2e8f0; }

.iot-chart-wrapper { flex: 1; min-height: 0; margin: 0 -10px; position: relative; z-index: 1;}

/* ─── FOOTER VEHÍCULO IOT ─── */
.vehicle-vital-stats { display: flex; align-items: center; justify-content: space-between; background: #f8fafc; padding: 16px 24px; border-radius: 16px; margin-top: 16px; z-index: 2;}
.vital-item { display: flex; align-items: center; gap: 12px; position: relative;}
.v-icon { color: #64748b; transition: color 0.3s;}
.v-info { display: flex; flex-direction: column; }
.v-lbl { font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; }
.v-val { font-size: 13px; font-weight: 700; color: #0f172a; transition: color 0.3s;}
.vital-divider { width: 1px; height: 30px; background: #e2e8f0; }

/* POPOVER CONDUCTOR */
.clickable-driver { cursor: pointer; position: relative;}
.clickable-driver:hover .v-icon, .clickable-driver:hover .v-val { color: #3b82f6; }
.underline-effect { border-bottom: 1px dashed #cbd5e1; }

.driver-popover {
  position: absolute; bottom: calc(100% + 15px); left: 50%; transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(25px);
  border: 1px solid white; border-radius: 16px; padding: 16px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15); width: 260px; z-index: 100;
  cursor: default;
}
.driver-popover::after {
  content: ''; position: absolute; top: 100%; left: 50%; margin-left: -8px;
  border-width: 8px; border-style: solid; border-color: rgba(255,255,255,0.95) transparent transparent transparent;
}

.dp-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.dp-avatar { width: 44px; height: 44px; border-radius: 12px; object-fit: cover; border: 2px solid #e2e8f0; }
.dp-info h5 { margin: 0 0 2px 0; font-size: 14px; font-weight: 800; color: #0f172a; }
.dp-info span { display: block; font-size: 10px; color: #64748b; font-weight: 600; }
.dp-phone { color: #0f172a !important; font-weight: 700 !important; margin-top: 2px;}

.dp-actions { display: flex; gap: 8px; }
.btn-dp { flex: 1; padding: 8px; border-radius: 10px; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 11px; font-weight: 700; text-decoration: none; transition: 0.2s;}
.btn-dp.call { background: #0f172a; color: white; }
.btn-dp.call:hover { background: #1e293b; }
.btn-dp.wa { background: #25D366; color: white; }
.btn-dp.wa:hover { background: #20BA56; }

.popover-overlay { position: fixed; inset: 0; z-index: 90; }

.pop-up-enter-active, .pop-up-leave-active { transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
.pop-up-enter-from, .pop-up-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.95); }

/* ─── COLUMNA DERECHA ─── */
.side-column { display: flex; flex-direction: column; gap: 20px; min-height: 0; }
.flex-half { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.chart-header h4 { margin: 0; font-size: 14px; font-weight: 800; color: #0f172a; }

/* Event Log */
.event-log-container { flex: 1; overflow-y: auto; padding-right: 4px; }
.event-list { display: flex; flex-direction: column; gap: 12px; }
.event-item { display: flex; align-items: flex-start; gap: 12px; font-size: 12px; }
.e-time { font-weight: 700; color: #64748b; width: 50px; flex-shrink: 0;}
.e-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 4px; flex-shrink: 0;}
.e-dot.info { background: #3b82f6; } .e-dot.success { background: #10b981; }
.e-dot.warning { background: #f59e0b; } .e-dot.error { background: #ef4444; }
.e-msg { color: #334155; font-weight: 500; line-height: 1.4; transition: color 0.3s;}

.list-enter-active, .list-leave-active { transition: all 0.4s ease; }
.list-enter-from { opacity: 0; transform: translateX(-20px); }
.list-leave-to { opacity: 0; transform: translateX(20px); }

/* Recientes */
.recent-list { display: flex; flex-direction: column; gap: 10px; overflow-y: auto; padding-right: 4px; flex: 1;}
.liquid-item { padding: 12px 16px; background: #f8fafc; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; border: 1px solid transparent; transition: 0.2s;}
.liquid-item:hover { background: white; border-color: #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.03);}
.r-id { font-weight: 700; color: #0f172a; font-size: 13px; }
.r-amount { font-weight: 800; color: #0f172a; font-size: 13px;}
.r-status { font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 4px 8px; border-radius: 6px; }
.r-status.pending_approval { background: #fef2f2; color: #ef4444;}
.r-status.approved { background: #f0fdf4; color: #10b981;}
.r-status.in_transit { background: #eff6ff; color: #3b82f6;}
.r-status.delivered { background: #f1f5f9; color: #64748b;}
.btn-link { background: none; border: none; color: #3b82f6; font-weight: 600; font-size: 12px; cursor: pointer; }

@keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.2); } 100% { opacity: 1; transform: scale(1); } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* ─── RESPONSIVE ─── */
@media (max-width: 1024px) {
  .provider-dashboard { height: auto; overflow: visible; }
  .kpi-grid { grid-template-columns: 1fr 1fr; }
  .main-content-grid { grid-template-columns: 1fr; }
  .side-column { min-height: auto; }
}

@media (max-width: 768px) {
  .header-section { flex-direction: column; align-items: flex-start; gap: 16px; }
  .header-actions { width: 100%; flex-wrap: wrap; }
  .kpi-grid { grid-template-columns: 1fr; }
  .iot-top-bar { flex-direction: column; align-items: flex-start; gap: 16px; }
  .iot-horizontal-metrics { width: 100%; flex-direction: column; }
  .metric-pill { width: 100%; justify-content: center; }
  .vehicle-vital-stats { flex-direction: column; align-items: flex-start; gap: 16px; }
  .vital-divider { display: none; }
}
</style>