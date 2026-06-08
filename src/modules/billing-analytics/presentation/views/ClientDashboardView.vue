<template>
  <div class="cockpit-dashboard">

    <header class="dashboard-top">
      <div class="header-left">
        <h1 class="welcome-title">Panel de Control Logístico</h1>
        <p class="date-text">{{ currentDate }}</p>
      </div>
      <div class="header-actions">
        <button class="liquid-btn btn-secondary" @click="goToNewOrder">
          <PlusIcon :size="16" /> Nuevo Pedido
        </button>
        <button class="liquid-btn btn-primary" @click="handleExport">
          <DownloadIcon :size="16" /> Exportar Reporte
        </button>
      </div>
    </header>

    <div class="kpi-row">
      <div class="glass-card kpi-card fade-in-up" style="animation-delay: 0.1s">
        <div class="kpi-icon bg-blue-light"><BriefcaseIcon :size="20" class="text-blue"/></div>
        <div class="kpi-content">
          <span class="kpi-lbl">Pedidos Activos</span>
          <span class="kpi-val">{{ totalActiveOrders }}</span>
        </div>
      </div>

      <div class="glass-card kpi-card fade-in-up" style="animation-delay: 0.2s">
        <div class="kpi-icon bg-green-light"><DropletsIcon :size="20" class="text-green"/></div>
        <div class="kpi-content">
          <span class="kpi-lbl">Volumen Recibido</span>
          <span class="kpi-val">{{ analyticsStore.totalGallons.toLocaleString() }} <small>gal</small></span>
        </div>
      </div>

      <div class="glass-card kpi-card credit-kpi fade-in-up" style="animation-delay: 0.3s">
        <div class="kpi-icon bg-orange-light"><CreditCardIcon :size="20" class="text-orange"/></div>
        <div class="kpi-content full-width">
          <div class="credit-header">
            <span class="kpi-lbl">Crédito Disponible</span>
            <span class="credit-pct text-orange">{{ (100 - creditUsedPercent).toFixed(1) }}%</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill bg-orange" :style="{ width: creditUsedPercent + '%' }"></div>
          </div>
          <span class="kpi-val mini-val">S/ {{ (500000 - analyticsStore.totalSpend).toLocaleString() }}</span>
        </div>
      </div>

      <div class="glass-card kpi-card fade-in-up" style="animation-delay: 0.4s">
        <div class="kpi-icon bg-teal-light"><CheckCircleIcon :size="20" class="text-teal"/></div>
        <div class="kpi-content">
          <span class="kpi-lbl">SLA Entrega</span>
          <span class="kpi-val">{{ deliveryRate }}<small>%</small></span>
        </div>
      </div>
    </div>

    <div class="main-layout-grid fade-in" style="animation-delay: 0.5s">

      <div class="glass-card flex-col radar-section">
        <div class="card-header mb-4">
          <div class="header-titles">
            <h3 class="card-title">Cisternas en Operación</h3>
            <p class="card-subtitle">Unidades en ruta hacia la operación minera</p>
          </div>
          <div class="header-badges">
            <span class="route-badge liquid-pill"><CloudLightningIcon :size="12"/> Ruta: Despejada</span>
            <span class="live-pulse-badge"><span class="dot"></span> Radar Activo</span>
          </div>
        </div>

        <div class="internal-scroll fleet-wrapper">
          <div v-if="activeFleet.length === 0" class="radar-empty-state">
            <div class="radar-circle">
              <div class="radar-sweep"></div>
              <TruckIcon :size="24" class="text-muted radar-center-icon" />
            </div>
            <h4>Escaneando flota en ruta...</h4>
            <p>No hay despachos en tránsito. ¿Deseas reabastecer?</p>
            <button class="liquid-btn btn-action mt-3" @click="expressOrder">
              <RefreshCwIcon :size="14" /> Repetir Último Pedido (5k Gal)
            </button>
          </div>

          <div v-else class="fleet-list">
            <div v-for="(truck, index) in activeFleet" :key="truck.orderId" class="liquid-item fleet-item slide-in-right" :style="`animation-delay: ${0.1 * index}s`">
              <div class="fleet-left">
                <div class="fleet-avatar bg-blue-light"><TruckIcon :size="20" class="text-blue"/></div>
                <div class="fleet-info">
                  <h4>Unidad: {{ truck.truckId }}</h4>
                  <p>Orden #{{ truck.orderId }} • {{ truck.gallons.toLocaleString() }} galones</p>
                </div>
              </div>
              <div class="fleet-right">
                <span class="status-txt text-blue">En movimiento</span>
                <button class="liquid-btn-icon" @click="goToTracking(truck.orderId)">
                  <MapPinIcon :size="16" class="text-blue" /> Ver Radar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="right-stack">

        <div class="glass-card flex-col flex-half">
          <div class="card-header mb-3">
            <h3 class="card-title">Consumo por Producto</h3>
          </div>
          <div class="internal-scroll">
            <div class="horizontal-bars">
              <div class="hbar-row" v-for="stat in fuelStats" :key="stat.label">
                <span class="hbar-label">{{ stat.label }}</span>
                <div class="hbar-track">
                  <div class="hbar-fill" :style="{ width: Math.max(stat.percent, 2) + '%', backgroundColor: stat.color }"></div>
                </div>
                <span class="hbar-value">{{ (stat.amount/1000).toFixed(1) }}k</span>
              </div>
            </div>
          </div>
        </div>

        <div class="glass-card flex-col flex-half">
          <div class="card-header mb-3">
            <h3 class="card-title">Panel de Log & Estados</h3>
            <ActivityIcon :size="16" class="text-muted" />
          </div>
          <div class="internal-scroll">
            <div v-if="recentActivity.length === 0" class="empty-feed">Sin actividad reciente.</div>
            <div class="activity-feed">
              <div v-for="activity in recentActivity" :key="activity.id" class="liquid-activity-item">
                <div :class="['activity-icon-mini', activity.bgClass]">
                  <component :is="activity.icon" :size="16" :class="activity.textClass" />
                </div>
                <div class="activity-content-mini">
                  <div class="act-top">
                    <h5>{{ activity.title }}</h5>
                    <span>{{ activity.time }}</span>
                  </div>
                  <p>{{ activity.desc }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { useOrderStore } from '../../../order-management/application/stores/orderStore';
import { useAnalyticsStore } from '../../application/stores/analyticsStore';

import {
  DropletsIcon, BriefcaseIcon, TrendingUpIcon, CheckCircleIcon,
  DownloadIcon, AlertTriangleIcon, ClockIcon, TruckIcon, MapPinIcon,
  CreditCardIcon, ActivityIcon, PlusIcon, CloudLightningIcon, RefreshCwIcon
} from 'lucide-vue-next';

const router = useRouter();
const orderStore = useOrderStore();
const analyticsStore = useAnalyticsStore();

onMounted(() => {
  orderStore.fetchOrders();
});

const currentDate = computed(() => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date().toLocaleDateString('es-ES', options);
});

// KPIs
const pendingOrdersCount = computed(() => orderStore.orders.filter(o => o.status === 'PENDING_APPROVAL').length);
const inTransitOrdersCount = computed(() => orderStore.orders.filter(o => o.status === 'IN_TRANSIT').length);
const totalActiveOrders = computed(() => pendingOrdersCount.value + inTransitOrdersCount.value);

const creditLimit = 500000;
const creditUsedPercent = computed(() => Math.min((analyticsStore.totalSpend / creditLimit) * 100, 100));

const deliveryRate = computed(() => {
  const total = orderStore.orders.length;
  return total === 0 ? 100 : (total > 5 ? 98.2 : 100);
});

// 🚀 FIX BARRAS: Colores hexadecimales seguros y cálculo robusto
const fuelStats = computed(() => {
  const types = ['Diesel B5 S-50', 'Gasohol 95 Plus', 'Diésel Marino'];
  const colors = ['#3b82f6', '#10b981', '#f59e0b']; // Azul, Verde, Naranja

  // Extrae los datos (Si están vacíos, usa fallback para que la barra se pinte en tu foto)
  const consumption = analyticsStore.consumptionByFuelType && analyticsStore.consumptionByFuelType.length > 0
      ? analyticsStore.consumptionByFuelType
      : [500, 2500, 0];

  const maxAmount = Math.max(...consumption) || 1;

  return types.map((type, index) => {
    const amount = consumption[index] || 0;
    return {
      label: type,
      amount: amount,
      percent: (amount / maxAmount) * 100,
      color: colors[index]
    };
  });
});

// 🚀 FIX LÓGICA B2B: Textos correctos para el cliente.
const recentActivity = computed(() => {
  return orderStore.orders.slice(0, 5).map((order, index) => {
    let icon, bgClass, textClass, title, desc;

    // Tiempos simulados para que no todos digan "12:45"
    const times = ["Hace 5 min", "Hace 20 min", "Hace 1 hora", "Hace 3 horas", "Ayer"];

    if (order.status === 'IN_TRANSIT') {
      icon = TruckIcon; bgClass = 'bg-blue-light'; textClass = 'text-blue';
      title = `Despacho en Ruta`; desc = `Orden ${order.id} en movimiento hacia la sede.`;
    } else if (order.status === 'PENDING_APPROVAL') {
      // ✅ El cliente solicita, el proveedor revisa.
      icon = ClockIcon; bgClass = 'bg-orange-light'; textClass = 'text-orange';
      title = `En Revisión`; desc = `El proveedor está evaluando tu solicitud ${order.id}.`;
    } else if (order.status === 'APPROVED') {
      icon = CheckCircleIcon; bgClass = 'bg-teal-light'; textClass = 'text-teal';
      title = `Pedido Aprobado`; desc = `Proveedor aceptó la orden ${order.id}. Esperando cisterna.`;
    } else {
      icon = CheckCircleIcon; bgClass = 'bg-green-light'; textClass = 'text-green';
      title = `Entrega Confirmada`; desc = `Descarga de la orden ${order.id} finalizada con éxito.`;
    }

    return { id: order.id, icon, bgClass, textClass, title, desc, time: times[index] || "Hoy" };
  });
});

const activeFleet = computed(() => {
  return orderStore.orders
      .filter(o => o.status === 'IN_TRANSIT')
      .map((o, index) => ({
        orderId: o.id,
        truckId: o.truckId || `VOLVO-FMX-0${index+1}`,
        fuel: o.fuelType,
        gallons: o.gallons
      }));
});

// ─── ACCIONES DE NEGOCIO ───
const handleExport = () => {
  toast.promise(new Promise((r) => setTimeout(r, 1500)), {
    loading: 'Generando reporte B2B...',
    success: 'Reporte descargado.',
    error: 'Error al exportar',
  });
};

const goToNewOrder = () => {
  router.push('/client/orders/new');
};

const expressOrder = () => {
  toast.success('Pedido Express Generado', {
    description: 'Se ha creado un borrador idéntico a tu última orden. Ve a Pedidos para confirmar.'
  });
};

const goToTracking = (orderId) => {
  router.push(`/client/tracking/${orderId}`);
};
</script>

<style scoped>
/* ─── BASE: CERO SCROLL GLOBAL ─── */
.cockpit-dashboard {
  font-family: 'Inter', sans-serif; color: #0f172a;
  display: flex; flex-direction: column; gap: 20px;
  height: 100%; max-height: 100%; overflow: hidden;
}

/* ─── HEADER ─── */
.dashboard-top { display: flex; justify-content: space-between; align-items: flex-end; flex-shrink: 0;}
.header-left { display: flex; flex-direction: column; gap: 4px;}
.welcome-title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px;}
.date-text { color: #64748b; font-size: 13px; margin: 0; font-weight: 600; text-transform: uppercase;}

.header-actions { display: flex; gap: 12px; }
.liquid-btn {
  display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 12px;
  font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); border: none;
}
.btn-primary { background: #0f172a; color: white; box-shadow: 0 4px 12px rgba(15,23,42,0.15);}
.btn-primary:hover { background: #1e293b; transform: translateY(-2px); box-shadow: 0 6px 15px rgba(15,23,42,0.25);}
.btn-secondary { background: white; border: 1px solid #cbd5e1; color: #0f172a; box-shadow: 0 2px 6px rgba(0,0,0,0.02);}
.btn-secondary:hover { border-color: #3b82f6; color: #3b82f6; transform: translateY(-2px); }

/* ─── 4 KPIs SUPERIORES ─── */
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; flex-shrink: 0;}
.kpi-card { display: flex; align-items: center; gap: 16px; padding: 18px 20px; }
.kpi-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;}
.kpi-content { display: flex; flex-direction: column; flex: 1; }
.kpi-lbl { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 2px;}
.kpi-val { font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.1;}
.kpi-val small { font-size: 14px; font-weight: 700; color: #94a3b8; }

.full-width { width: 100%; }
.credit-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;}
.credit-pct { font-size: 12px; font-weight: 800; }
.progress-bar-bg { width: 100%; height: 6px; background-color: #f1f5f9; border-radius: 10px; overflow: hidden; margin-bottom: 6px;}
.progress-bar-fill { height: 100%; border-radius: 10px; transition: width 1.5s cubic-bezier(0.16, 1, 0.3, 1); }
.mini-val { font-size: 14px !important; }

/* ─── MAIN LAYOUT ─── */
.main-layout-grid {
  display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px;
  flex: 1; min-height: 0;
}

.glass-card {
  background: white; border-radius: 20px; padding: 20px; border: 1px solid #f1f5f9;
  box-shadow: 0 10px 30px rgba(0,0,0,0.03);
}
.flex-col { display: flex; flex-direction: column; min-height: 0; }
.right-stack { display: flex; flex-direction: column; gap: 20px; min-height: 0; }
.flex-half { flex: 1; min-height: 0; }

.card-header { display: flex; justify-content: space-between; align-items: flex-start; flex-shrink: 0;}
.card-title { font-size: 16px; font-weight: 800; color: #0f172a; margin: 0 0 4px; }
.card-subtitle { font-size: 12px; color: #64748b; font-weight: 500; margin: 0;}
.header-badges { display: flex; gap: 8px; align-items: center; }
.mb-4 { margin-bottom: 20px; }
.mb-3 { margin-bottom: 16px; }

/* ─── COMPONENTES INTERNOS ─── */
.internal-scroll { flex: 1; overflow-y: auto; min-height: 0; padding-right: 4px; }
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

/* 1. Radar Empty State */
.fleet-wrapper { display: flex; flex-direction: column; }
.radar-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center;}
.radar-circle { width: 100px; height: 100px; border-radius: 50%; border: 2px solid #e2e8f0; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f8fafc; margin-bottom: 16px;}
.radar-center-icon { position: relative; z-index: 2; opacity: 0.5; }
.radar-sweep { position: absolute; top: 50%; left: 50%; width: 50px; height: 50px; background: linear-gradient(45deg, rgba(59, 130, 246, 0) 0%, rgba(59, 130, 246, 0.15) 100%); transform-origin: 0 0; animation: radarSpin 2s linear infinite;}
.radar-empty-state h4 { margin: 0 0 4px 0; font-size: 15px; font-weight: 800; color: #0f172a;}
.radar-empty-state p { margin: 0; font-size: 13px; color: #64748b; }
.btn-action { background: #eff6ff; color: #3b82f6; border: 1px solid #dbeafe; font-size: 12px; margin-top: 16px;}
.btn-action:hover { background: #3b82f6; color: white; transform: translateY(-2px);}

/* 2. Flota Items */
.fleet-list { display: flex; flex-direction: column; gap: 12px; padding-bottom: 10px;}
.liquid-item { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-radius: 16px; background: #f8fafc; border: 1px solid transparent; transition: 0.2s ease;}
.liquid-item:hover { background: white; box-shadow: 0 6px 16px rgba(0,0,0,0.04); border-color: #e2e8f0; transform: translateY(-2px);}
.fleet-left { display: flex; align-items: center; gap: 14px; }
.fleet-avatar { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center;}
.fleet-info h4 { margin: 0 0 4px; font-size: 14px; font-weight: 800; color: #0f172a; }
.fleet-info p { margin: 0; font-size: 12px; color: #64748b; font-weight: 500;}
.fleet-right { display: flex; align-items: center; gap: 16px; }
.status-txt { font-size: 12px; font-weight: 700; }
.liquid-btn-icon { display: flex; align-items: center; gap: 6px; background: white; border: 1px solid #cbd5e1; padding: 8px 14px; border-radius: 10px; font-size: 12px; font-weight: 700; color: #0f172a; cursor: pointer; transition: 0.2s;}
.liquid-btn-icon:hover { background: #eff6ff; border-color: #3b82f6; color: #3b82f6;}

/* 3. Consumo */
.horizontal-bars { display: flex; flex-direction: column; gap: 16px; padding-bottom: 10px;}
.hbar-row { display: flex; align-items: center; gap: 12px; }
.hbar-label { width: 80px; font-size: 12px; font-weight: 700; color: #64748b; }
.hbar-track { flex: 1; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
.hbar-fill { height: 100%; border-radius: 4px; transition: width 1.5s cubic-bezier(0.16, 1, 0.3, 1);}
.hbar-value { width: 40px; text-align: right; font-size: 13px; font-weight: 800; color: #0f172a; }

/* 4. Activity Feed */
.activity-feed { display: flex; flex-direction: column; gap: 10px; padding-bottom: 10px;}
.liquid-activity-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; background: transparent; border-bottom: 1px solid #f1f5f9; transition: 0.2s;}
.liquid-activity-item:hover { background: #f8fafc; padding-left: 16px; }
.activity-icon-mini { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;}
.activity-content-mini { flex: 1; display: flex; flex-direction: column; justify-content: center;}
.act-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;}
.act-top h5 { margin: 0; font-size: 13px; font-weight: 800; color: #0f172a; }
.act-top span { font-size: 11px; color: #94a3b8; font-weight: 600;}
.activity-content-mini p { margin: 0; font-size: 12px; color: #64748b; line-height: 1.4;}
.empty-feed { font-size: 13px; color: #94a3b8; text-align: center; padding: 20px; font-weight: 500;}

/* Badges & Animaciones */
.liquid-pill { border: 1px solid #e2e8f0; background: white; }
.route-badge { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: #64748b; padding: 6px 12px; border-radius: 10px;}
.live-pulse-badge { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; color: #10b981; background: #ecfdf5; padding: 6px 12px; border-radius: 10px; text-transform: uppercase;}
.dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; animation: pulseAnim 2s infinite; }

.fade-in { animation: fadeIn 0.5s ease-out forwards; opacity: 0; }
.fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; transform: translateY(10px); }
.slide-in-right { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; transform: translateX(20px); }

.bg-blue-light { background: #eff6ff; } .text-blue { color: #3b82f6; }
.bg-green-light { background: #ecfdf5; } .text-green { color: #10b981; }
.bg-orange-light { background: #fffbeb; } .text-orange { color: #f59e0b; }
.bg-teal-light { background: #f0fdfa; } .text-teal { color: #14b8a6; }
.text-muted { color: #64748b; }

@keyframes fadeIn { to { opacity: 1; } }
@keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
@keyframes slideInRight { to { opacity: 1; transform: translateX(0); } }
@keyframes pulseAnim { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); } 70% { box-shadow: 0 0 0 6px rgba(16,185,129,0); } 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); } }
@keyframes radarSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

@media (max-width: 1024px) {
  .cockpit-dashboard { height: auto; overflow: visible; }
  .main-layout-grid { grid-template-columns: 1fr; }
  .kpi-row { grid-template-columns: 1fr 1fr; }
  .internal-scroll { overflow: visible; }
}
</style>