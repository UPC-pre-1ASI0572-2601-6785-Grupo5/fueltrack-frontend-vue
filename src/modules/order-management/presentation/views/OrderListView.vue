<template>
  <div class="cockpit-dashboard">
    <header class="dashboard-top">
      <div class="header-left">
        <h1 class="welcome-title">Mis Pedidos Operativos</h1>
        <p class="date-text">Gestión y rastreo de solicitudes logísticas</p>
      </div>
      <div class="header-actions">
        <button class="liquid-btn btn-secondary" @click="goToCreateOrder(true)">
          <RefreshCwIcon :size="14" /> Pedido Express
        </button>
        <button class="liquid-btn btn-primary" @click="goToCreateOrder(false)">
          <PlusIcon :size="14" /> Nuevo Pedido
        </button>
      </div>
    </header>

    <div class="glass-card toolbar-bento fade-in-up" style="animation-delay: 0.1s">
      <div class="search-box">
        <SearchIcon :size="16" class="text-muted" />
        <input type="text" v-model="searchQuery" placeholder="Buscar por ID, OC o Estado..." class="search-input" />
      </div>

      <div class="filter-tabs">
        <button :class="['liquid-tab', { active: statusFilter === 'ALL' }]" @click="statusFilter = 'ALL'">Todos</button>
        <button :class="['liquid-tab', { active: statusFilter === 'PENDING_APPROVAL' }]" @click="statusFilter = 'PENDING_APPROVAL'">En Revisión</button>
        <button :class="['liquid-tab', { active: statusFilter === 'IN_TRANSIT' }]" @click="statusFilter = 'IN_TRANSIT'">En Ruta</button>
        <button :class="['liquid-tab', { active: statusFilter === 'DELIVERED' }]" @click="statusFilter = 'DELIVERED'">Completados</button>
      </div>
    </div>

    <div class="main-split-layout fade-in-up" style="animation-delay: 0.2s">

      <div class="glass-card flex-fill flex-col table-section">
        <div v-if="orderStore.isLoading" class="radar-empty-state">
          <Loader2Icon class="spinner text-blue mb-2" :size="32" />
          <h4>Sincronizando operaciones...</h4>
        </div>

        <div v-else class="table-scroll-wrapper">
          <table class="liquid-table">
            <thead>
            <tr>
              <th>ID Operación</th>
              <th>Producto</th>
              <th>Volumen</th>
              <th>Estado</th>
              <th>Fecha Alta</th>
              <th class="text-right">Acción</th>
            </tr>
            </thead>
            <tbody>
            <tr v-if="filteredOrders.length === 0">
              <td colspan="6" class="empty-state">
                <InboxIcon :size="32" class="text-muted mb-2" />
                <p>No se encontraron pedidos con esos filtros.</p>
              </td>
            </tr>

            <tr v-for="order in filteredOrders" :key="order.id" class="table-row" :class="{'row-active': selectedOrder?.id === order.id}">
              <td class="font-bold text-main">{{ order.id }}</td>

              <td>
                <div class="cell-flex">
                  <div :class="['icon-box-mini', getFuelColor(order.fuelType)]"><DropletIcon :size="14" /></div>
                  <span class="font-bold">{{ order.fuelType }}</span>
                </div>
              </td>

              <td class="font-bold">{{ order.gallons.toLocaleString() }} <span class="text-muted text-xs">gal</span></td>

              <td>
                  <span :class="['status-pill', order.status.toLowerCase()]">
                    <component :is="getStatusIcon(order.status)" :size="12" />
                    <span v-if="!selectedOrder">{{ formatStatus(order.status) }}</span>
                  </span>
              </td>

              <td class="text-muted font-semibold text-sm">{{ formatDate(order.createdAt) }}</td>

              <td class="actions-cell">
                <button class="liquid-btn-icon hover-dark" @click="toggleOrderDetails(order)">
                  <EyeIcon :size="14" /> <span v-if="!selectedOrder">Detalle</span>
                </button>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

      <transition name="slide-panel">
        <div v-if="selectedOrder" class="detail-panel-wrapper">
          <div class="glass-card detail-panel flex-col">

            <div class="detail-header">
              <div class="dh-title">
                <h3>Pedido {{ selectedOrder.id }}</h3>
                <span :class="['status-pill', selectedOrder.status.toLowerCase()]">
                  {{ formatStatus(selectedOrder.status) }}
                </span>
              </div>
              <button class="btn-close" @click="selectedOrder = null"><XIcon :size="18"/></button>
            </div>

            <div class="detail-scroll internal-scroll">

              <div class="detail-block">
                <h4 class="block-title"><MapPinIcon :size="14"/> Datos Logísticos</h4>
                <div class="data-grid">
                  <div class="data-item">
                    <span class="d-lbl">Destino</span>
                    <span class="d-val">{{ selectedOrder.location || 'Minera Yanacocha - Tajo Norte' }}</span>
                  </div>
                  <div class="data-item">
                    <span class="d-lbl">Ventana SLA</span>
                    <span class="d-val">{{ selectedOrder.slaWindow || 'Prioritario (24h hábiles)' }}</span>
                  </div>
                </div>
              </div>

              <div class="detail-block mt-4">
                <h4 class="block-title"><ShieldCheckIcon :size="14"/> Imputación Financiera</h4>
                <div class="data-grid">
                  <div class="data-item">
                    <span class="d-lbl">Orden de Compra (ERP)</span>
                    <span class="d-val font-mono bg-gray">{{ selectedOrder.documentRef || 'N/A' }}</span>
                  </div>
                  <div class="data-item">
                    <span class="d-lbl">Centro de Costos</span>
                    <span class="d-val">{{ selectedOrder.costCenter || 'OT-MANT-EQUIPOS' }}</span>
                  </div>
                </div>
              </div>

              <div class="quote-box mt-4">
                <div class="qb-row">
                  <span class="qb-lbl">Precio Base Indexado (Hoy)</span>
                  <span class="qb-val">S/ 16.45 / gal</span>
                </div>
                <div class="qb-row">
                  <span class="qb-lbl">Volumen Solicitado</span>
                  <span class="qb-val">{{ selectedOrder.gallons.toLocaleString() }} gal</span>
                </div>
                <div class="qb-divider"></div>
                <div class="qb-row">
                  <span class="qb-lbl">Subtotal</span>
                  <span class="qb-val">S/ {{ (selectedOrder.gallons * 16.45).toLocaleString('es-PE', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="qb-row">
                  <span class="qb-lbl">IGV (18%)</span>
                  <span class="qb-val">S/ {{ (selectedOrder.gallons * 16.45 * 0.18).toLocaleString('es-PE', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="qb-divider"></div>
                <div class="qb-total">
                  <span>Total Estimado</span>
                  <span class="text-blue">S/ {{ (selectedOrder.gallons * 16.45 * 1.18).toLocaleString('es-PE', { minimumFractionDigits: 2 }) }}</span>
                </div>
              </div>

            </div>

            <div class="detail-actions">
              <button v-if="selectedOrder.status === 'IN_TRANSIT'" class="liquid-btn btn-track w-full" @click="goToTracking(selectedOrder.id)">
                <MapPinIcon :size="14" /> Rastrear Cisterna
              </button>
              <button class="liquid-btn btn-secondary w-full" @click="downloadVoucher(selectedOrder)">
                <DownloadIcon :size="14" /> Exportar Voucher Legal PDF
              </button>
            </div>

          </div>
        </div>
      </transition>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useOrderStore } from '../../../order-management/application/stores/orderStore';
import { generateOrderVoucher } from '@/core/utils/pdfGenerator';
import { toast } from 'vue-sonner';
import {
  PlusIcon, SearchIcon, DropletIcon, FileTextIcon, MapPinIcon, ClockIcon,
  TruckIcon, CheckCircleIcon, InboxIcon, Loader2Icon, DownloadIcon, RefreshCwIcon,
  EyeIcon, XIcon, ShieldCheckIcon
} from 'lucide-vue-next';

const orderStore = useOrderStore();
const router = useRouter();

const searchQuery = ref('');
const statusFilter = ref('ALL');
const selectedOrder = ref(null);

const goToCreateOrder = (isExpress = false) => {
  if (isExpress) {
    router.push('/client/orders/new?express=true');
  } else {
    router.push('/client/orders/new');
  }
};

const filteredOrders = computed(() => {
  return orderStore.orders.filter(order => {
    const query = searchQuery.value.toLowerCase();
    const matchesSearch = String(order.id).toLowerCase().includes(query) || (order.documentRef && order.documentRef.toLowerCase().includes(query));
    const matchesStatus = statusFilter.value === 'ALL' || order.status === statusFilter.value;
    return matchesSearch && matchesStatus;
  });
});

const toggleOrderDetails = (order) => {
  if (selectedOrder.value?.id === order.id) {
    selectedOrder.value = null;
  } else {
    selectedOrder.value = order;
  }
};

const formatStatus = (status) => {
  const map = { 'PENDING_APPROVAL': 'En revisión', 'APPROVED': 'Aprobado', 'IN_TRANSIT': 'En ruta', 'DELIVERED': 'Entregado' };
  return map[status] || status;
};

const getStatusIcon = (status) => {
  const icons = { 'PENDING_APPROVAL': ClockIcon, 'IN_TRANSIT': TruckIcon, 'DELIVERED': CheckCircleIcon, 'APPROVED': CheckCircleIcon };
  return icons[status] || ClockIcon;
};

const getFuelColor = (fuelType) => {
  if (fuelType.includes('Diesel')) return 'bg-blue';
  if (fuelType.includes('95')) return 'bg-green';
  return 'bg-orange';
};

const formatDate = (date) => {
  if (!date) return '---';
  return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
};

const goToTracking = (orderId) => router.push(`/client/tracking/${orderId}`);

const downloadVoucher = (order) => {
  toast.success('Generando Voucher PDF', { description: `Descargando documento legal para ${order.id}...` });
  generateOrderVoucher(order);
};

onMounted(() => orderStore.fetchOrders());
</script>

<style scoped>
/* ─── BASE: CERO SCROLL GLOBAL ─── */
.cockpit-dashboard { font-family: 'Inter', sans-serif; color: #0f172a; display: flex; flex-direction: column; gap: 20px; height: 100%; max-height: 100%; overflow: hidden; }

/* ─── HEADER ─── */
.dashboard-top { display: flex; justify-content: space-between; align-items: flex-end; flex-shrink: 0;}
.header-left { display: flex; flex-direction: column; gap: 4px;}
.welcome-title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px;}
.date-text { color: #64748b; font-size: 13px; margin: 0; font-weight: 600; text-transform: uppercase;}
.header-actions { display: flex; gap: 12px; }

/* Botones */
.liquid-btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.2s; border: none; }
.btn-primary { background: #0f172a; color: white; box-shadow: 0 4px 12px rgba(15,23,42,0.15);}
.btn-primary:hover { background: #1e293b; transform: translateY(-2px); }
.btn-secondary { background: white; border: 1px solid #cbd5e1; color: #0f172a; }
.btn-secondary:hover { background: #f8fafc; border-color: #3b82f6; transform: translateY(-2px); }
.btn-track { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
.btn-track:hover { background: #2563eb; color: white; transform: translateY(-2px); }
.w-full { width: 100%; margin-top: 10px;}

/* ─── TOOLBAR BENTO ─── */
.toolbar-bento { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px !important; flex-shrink: 0;}
.search-box { display: flex; align-items: center; gap: 8px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 16px; border-radius: 12px; width: 350px; transition: 0.2s; }
.search-box:focus-within { border-color: #3b82f6; background: white; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
.search-input { border: none; outline: none; background: transparent; width: 100%; font-size: 13px; font-weight: 600; color: #0f172a; }
.search-input::placeholder { color: #94a3b8; font-weight: 500;}

.filter-tabs { display: flex; background: #f1f5f9; padding: 4px; border-radius: 12px; gap: 4px;}
.liquid-tab { border: none; background: transparent; padding: 8px 16px; border-radius: 10px; font-size: 12px; font-weight: 700; color: #64748b; cursor: pointer; transition: 0.2s; }
.liquid-tab:hover { color: #0f172a; }
.liquid-tab.active { background: white; color: #0f172a; box-shadow: 0 2px 6px rgba(0,0,0,0.05); }

/* ─── MAIN SPLIT LAYOUT (Master & Detail) ─── */
.main-split-layout {
  display: flex; flex: 1; min-height: 0;
  /* Eliminamos el 'gap' del padre. El margen lo da el hijo para no saltar al animar */
}
.glass-card { background: white; border-radius: 20px; padding: 20px; border: 1px solid #f1f5f9; box-shadow: 0 10px 30px rgba(0,0,0,0.03); }
.flex-fill { flex: 1; min-height: 0; }
.flex-col { display: flex; flex-direction: column; }

/* Sección Tabla (Izquierda) */
.table-section { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.table-scroll-wrapper { flex: 1; overflow-y: auto; padding-right: 4px; }
.internal-scroll { flex: 1; overflow-y: auto; padding-right: 8px; }
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

.liquid-table { width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; }
.liquid-table th { position: sticky; top: 0; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); z-index: 10; padding: 12px 16px; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; }
.liquid-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; vertical-align: middle; transition: 0.2s;}
.table-row { transition: 0.2s; cursor: pointer;}
.table-row:hover td { background: #f8fafc; }
.row-active td { background: #eff6ff !important; border-bottom-color: #bfdbfe; }

/* 🚀 PANEL LATERAL (EL SECRETO DE LA FLUIDEZ) */
.detail-panel-wrapper {
  width: 420px;
  margin-left: 20px; /* Este margin reemplaza el gap del padre */
  flex-shrink: 0;
  display: flex;
}
.detail-panel {
  width: 420px; /* Ancho fijo interno para no aplastar el texto al cerrar */
  padding: 0; overflow: hidden; border-left: 2px solid #e2e8f0;
}
.detail-header { padding: 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-start;}
.dh-title h3 { margin: 0 0 6px 0; font-size: 18px; font-weight: 800; color: #0f172a;}
.btn-close { background: white; border: 1px solid #cbd5e1; border-radius: 8px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; transition: 0.2s;}
.btn-close:hover { background: #fef2f2; color: #ef4444; border-color: #fecaca;}

.detail-scroll { padding: 20px; }
.block-title { font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin: 0 0 12px 0; display: flex; align-items: center; gap: 6px;}
.data-grid { display: flex; flex-direction: column; gap: 12px; }
.data-item { display: flex; flex-direction: column; gap: 4px; }
.d-lbl { font-size: 11px; font-weight: 600; color: #64748b; }
.d-val { font-size: 13px; font-weight: 700; color: #0f172a; }
.mt-4 { margin-top: 24px; }

/* Cotizador en vivo (Panel) */
.quote-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;}
.qb-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px;}
.qb-lbl { color: #64748b; font-weight: 600;}
.qb-val { color: #0f172a; font-weight: 700;}
.qb-divider { border-bottom: 1px dashed #cbd5e1; margin: 12px 0;}
.qb-total { display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 800; color: #0f172a;}
.qb-total .text-blue { font-size: 18px; color: #2563eb;}

.detail-actions { padding: 20px; border-top: 1px solid #e2e8f0; background: white;}

/* ─── TYPOGRAPHY & UTILS ─── */
.font-bold { font-weight: 800; }
.font-semibold { font-weight: 600; }
.font-mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }
.bg-gray { background: #f1f5f9; padding: 4px 8px; border-radius: 6px; border: 1px solid #e2e8f0;}
.text-main { color: #0f172a; } .text-muted { color: #64748b; } .text-blue { color: #2563eb; }
.text-xs { font-size: 11px; } .text-sm { font-size: 12px; } .text-right { text-align: right; }

.cell-flex { display: flex; align-items: center; gap: 10px; }
.icon-box-mini { width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
.bg-blue { background: #eff6ff; color: #3b82f6; } .bg-green { background: #ecfdf5; color: #10b981; } .bg-orange { background: #fffbeb; color: #f59e0b; }

.status-pill { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 10px; font-size: 11px; font-weight: 800; text-transform: uppercase;}
.status-pill.pending_approval { background: #fffbeb; color: #d97706; border: 1px solid #fef3c7; }
.status-pill.approved { background: #f0fdfa; color: #0d9488; border: 1px solid #ccfbf1; }
.status-pill.in_transit { background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; }
.status-pill.delivered { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

.actions-cell { display: flex; justify-content: flex-end; gap: 8px; }
.liquid-btn-icon { display: flex; align-items: center; gap: 6px; background: white; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; transition: 0.2s;}
.liquid-btn-icon:hover { background: #f1f5f9; color: #0f172a; border-color: #94a3b8;}

.radar-empty-state, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; color: #64748b;}
.empty-state { padding: 40px !important; }
.spinner { animation: spin 1s linear infinite; }

/* ─── ANIMACIÓN MASTER-DETAIL (60fps) ─── */
.fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; transform: translateY(10px); }

.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-panel-enter-from,
.slide-panel-leave-to {
  width: 0 !important;
  margin-left: 0 !important;
  opacity: 0;
  transform: translateX(30px);
}

@keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 1024px) {
  .main-split-layout { flex-direction: column; }
  .detail-panel-wrapper { width: 100%; margin-left: 0; margin-top: 20px;}
  .detail-panel { width: 100%; }
}
</style>