<template>
  <div class="orders-view">
    <div class="header-section">
      <div>
        <h2 class="page-title">Centro de Despacho Logístico</h2>
        <p class="page-subtitle">Revisión financiera y asignación de flota operativa</p>
      </div>
    </div>

    <div class="toolbar">
      <div class="search-box">
        <SearchIcon :size="18" class="text-muted" />
        <input
            type="text"
            v-model="searchQuery"
            placeholder="Buscar por ID o Voucher..."
            class="search-input"
        />
      </div>

      <div class="filter-tabs">
        <button :class="['tab', { active: statusFilter === 'ALL' }]" @click="statusFilter = 'ALL'">Todos</button>
        <button :class="['tab', { active: statusFilter === 'PENDING_APPROVAL' }]" @click="statusFilter = 'PENDING_APPROVAL'">Por Validar</button>
        <button :class="['tab', { active: statusFilter === 'APPROVED' }]" @click="statusFilter = 'APPROVED'">Por Asignar Flota</button>
        <button :class="['tab', { active: statusFilter === 'IN_TRANSIT' }]" @click="statusFilter = 'IN_TRANSIT'">En Ruta</button>
      </div>
    </div>

    <div v-if="orderStore.isLoading" class="loader-state">
      <Loader2Icon class="spinner" :size="32" />
      <p>Sincronizando requerimientos...</p>
    </div>

    <div v-else class="table-container">
      <table class="premium-table">
        <thead>
        <tr>
          <th>ID Operación</th>
          <th>Producto Solicitado</th>
          <th>Volumen</th>
          <th>Voucher / OC</th>
          <th>Estado Operativo</th>
          <th class="text-right">Acción Requerida</th>
        </tr>
        </thead>
        <tbody>
        <tr v-if="filteredOrders.length === 0">
          <td colspan="6" class="empty-state">
            <InboxIcon :size="48" class="empty-icon" />
            <h4>Bandeja limpia</h4>
            <p>No hay requerimientos pendientes bajo estos filtros.</p>
          </td>
        </tr>

        <tr v-for="order in filteredOrders" :key="order.id" class="table-row">
          <td class="font-medium text-main">{{ order.id }}</td>

          <td>
            <div class="cell-flex">
              <div :class="['icon-box', getFuelColor(order.fuelType)]">
                <DropletIcon :size="16" />
              </div>
              <div class="flex-col-data">
                <span>{{ order.fuelType }}</span>
                <div v-if="order.truckId" class="truck-info">
                  <TruckIcon :size="12" class="mr-1" />
                  {{ order.truckId }}
                </div>
              </div>
            </div>
          </td>

          <td class="font-semibold">{{ order.gallons.toLocaleString() }} <span class="text-muted text-xs">gal</span></td>

          <td>
            <div class="cell-flex text-blue font-mono text-sm">
              <FileTextIcon :size="14" />
              {{ order.documentRef || 'Sin doc.' }}
            </div>
          </td>

          <td>
              <span :class="['status-pill', order.status.toLowerCase()]">
                <component :is="getStatusIcon(order.status)" :size="14" class="mr-1" />
                {{ formatStatus(order.status) }}
              </span>
          </td>

          <td class="text-right actions-cell">
            <button
                v-if="order.status === 'PENDING_APPROVAL'"
                class="btn-action btn-approve"
                @click="promptApproval(order.id)"
                :disabled="orderStore.isSaving"
            >
              <CheckCircleIcon :size="16" />
              Aprobar Documento
            </button>

            <button
                v-else-if="order.status === 'APPROVED'"
                class="btn-action btn-dispatch"
                @click="openFleetModal(order.id)"
                :disabled="orderStore.isSaving"
            >
              <TruckIcon :size="16" />
              Asignar Cisterna
            </button>

            <div v-else-if="order.status === 'IN_TRANSIT'" class="flex-actions">
              <button
                  v-if="!isArrived(order)"
                  class="btn-action btn-accelerate"
                  @click="accelerateRoute(order.id)"
                  :disabled="orderStore.isSaving"
              >
                <FastForwardIcon :size="16" />
                Acelerar
              </button>
              <button
                  v-if="isArrived(order)"
                  class="btn-action btn-approve"
                  @click="markAsDelivered(order.id)"
                  :disabled="orderStore.isSaving"
              >
                <MapPinIcon :size="16" />
                Llegó al Destino
              </button>
            </div>

            <span v-else class="status-action-pill processed">
                <CheckCheckIcon :size="14" class="mr-1"/> Procesado
              </span>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <Transition name="modal-fade">
      <div v-if="showConfirmModal" class="modal-overlay" @click.self="showConfirmModal = false">
        <div class="modal-content confirm-dialog">
          <div class="dialog-icon-wrapper">
            <ShieldAlertIcon :size="32" class="text-emerald" />
          </div>
          <h3 class="dialog-title">¿Aprobar Documento?</h3>
          <p class="dialog-text">
            Vas a validar financieramente el comprobante del pedido <strong>{{ pendingOrderId }}</strong>.
            Esta acción es irreversible y notificará al cliente para proceder con la logística.
          </p>
          <div class="dialog-footer">
            <button class="btn-cancel" @click="showConfirmModal = false" :disabled="orderStore.isSaving">Cancelar</button>
            <button class="btn-submit btn-approve" @click="executeApproval" :disabled="orderStore.isSaving">
              <Loader2Icon v-if="orderStore.isSaving" :size="16" class="spinner" />
              <CheckCircleIcon v-else :size="16" />
              Sí, Aprobar
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <AssignFleetModal
        :isOpen="isModalOpen"
        :orderId="selectedOrderId"
        @close="isModalOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { toast } from 'vue-sonner';
import { useOrderStore } from '../../application/stores/orderStore';
import AssignFleetModal from '../components/AssignFleetModal.vue';
import {
  SearchIcon, DropletIcon, FileTextIcon,
  ClockIcon, TruckIcon, CheckCircleIcon,
  InboxIcon, Loader2Icon, ShieldAlertIcon,
  NavigationIcon, CheckCheckIcon, FastForwardIcon, MapPinIcon
} from 'lucide-vue-next';

const orderStore = useOrderStore();

// Estados
const isModalOpen = ref(false);
const selectedOrderId = ref('');
const searchQuery = ref('');
const statusFilter = ref('ALL');
const acceleratedOrders = ref(new Set(JSON.parse(localStorage.getItem('accelerated_orders') || '[]')));

// Estados del Modal de Confirmación
const showConfirmModal = ref(false);
const pendingOrderId = ref('');

const filteredOrders = computed(() => {
  return orderStore.orders.filter(order => {
    const query = searchQuery.value.toLowerCase();
    const matchesSearch = String(order.id).toLowerCase().includes(query) || (order.documentRef && order.documentRef.toLowerCase().includes(query));
    const matchesStatus = statusFilter.value === 'ALL' || order.status === statusFilter.value;
    return matchesSearch && matchesStatus;
  });
});

const formatStatus = (status) => {
  const map = { 'PENDING_APPROVAL': 'Validación Pendiente', 'APPROVED': 'Listo p/ Despacho', 'IN_TRANSIT': 'En Ruta', 'DELIVERED': 'Entregado' };
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

// --- NUEVO FLUJO DE APROBACIÓN ---
const promptApproval = (orderId) => {
  pendingOrderId.value = orderId;
  showConfirmModal.value = true; // Abre nuestro modal bonito, no el del navegador
};

const executeApproval = async () => {
  const orderId = pendingOrderId.value;

  // Cerramos el modal inmediatamente para dar feedback rápido
  showConfirmModal.value = false;

  toast.promise(
      new Promise(async (resolve, reject) => {
        const result = await orderStore.approveOrder(orderId);
        if(result.success) resolve(result);
        else reject(new Error(result.message));
      }),
      {
        loading: 'Validando documento financiero...',
        success: `Documento aprobado. El pedido ${orderId} está listo para despacho.`,
        error: 'Hubo un error al procesar la aprobación.'
      }
  );
};

const openFleetModal = (orderId) => {
  selectedOrderId.value = orderId;
  isModalOpen.value = true;
};

const accelerateRoute = (orderId) => {
  acceleratedOrders.value.add(orderId);
  localStorage.setItem('accelerated_orders', JSON.stringify([...acceleratedOrders.value]));
  toast.success(`Ruta acelerada para el pedido ${orderId}. Recalculando ETA...`, {
    icon: '⚡'
  });
};

const isArrived = (order) => {
  if (acceleratedOrders.value.has(order.id)) return true;
  if (!order.dispatchedAt || !order.etaMinutes) return false;
  
  const dispatchedTime = new Date(order.dispatchedAt).getTime();
  const elapsedMinutes = (nowTime.value - dispatchedTime) / 60000;
  
  return elapsedMinutes >= order.etaMinutes;
};

const markAsDelivered = async (orderId) => {
  toast.promise(
      new Promise(async (resolve, reject) => {
        const result = await orderStore.markAsDelivered(orderId);
        if(result.success) resolve(result);
        else reject(new Error(result.message));
      }),
      {
        loading: 'Registrando llegada...',
        success: `El pedido ${orderId} ha sido registrado como ENTREGADO.`,
        error: 'Error al registrar llegada.'
      }
  );
};

const nowTime = ref(Date.now());
let timer = null;

onMounted(() => {
  orderStore.fetchOrders();
  timer = setInterval(() => {
    nowTime.value = Date.now();
  }, 5000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
/* ESTILOS BASE DE LA TABLA PREMIUM */
:root {
  --bg-app: #F9FAFB; --bg-card: #FFFFFF; --text-main: #111827;
  --text-muted: #6B7280; --border-light: #E5E7EB;
}

.orders-view { font-family: 'Inter', sans-serif; padding: 12px; animation: fadeIn 0.4s ease-out; }
.header-section { margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 800; color: var(--text-main); margin: 0 0 4px 0; }
.page-subtitle { margin: 0; color: var(--text-muted); font-size: 14px; }

.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 16px; flex-wrap: wrap;}
.search-box { display: flex; align-items: center; gap: 8px; background: white; border: 1px solid var(--border-light); padding: 8px 16px; border-radius: 10px; width: 320px; box-shadow: 0 1px 2px rgba(0,0,0,0.02); transition: all 0.2s; }
.search-box:focus-within { border-color: #10B981; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1); }
.search-input { border: none; outline: none; width: 100%; font-size: 14px; color: var(--text-main); }
.search-input::placeholder { color: #9CA3AF; }

.filter-tabs { display: flex; background: #F3F4F6; padding: 4px; border-radius: 10px; }
.tab { border: none; background: transparent; padding: 6px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; color: var(--text-muted); cursor: pointer; transition: all 0.2s; }
.tab.active { background: white; color: var(--text-main); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

.table-container { background: white; border-radius: 16px; border: 1px solid var(--border-light); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); overflow-x: auto; }
.premium-table { width: 100%; border-collapse: separate; border-spacing: 0; }
.premium-table th { background: #F9FAFB; padding: 14px 20px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-light); }
.premium-table td { padding: 16px 20px; border-bottom: 1px solid var(--border-light); vertical-align: middle; font-size: 14px;}
.table-row { transition: background-color 0.2s; }
.table-row:hover { background-color: #F8FAFC; }

.font-medium { font-weight: 600; } .font-semibold { font-weight: 700; } .font-mono { font-family: 'ui-monospace', monospace; }
.text-main { color: var(--text-main); } .text-muted { color: var(--text-muted); } .text-blue { color: #2563EB; }
.text-xs { font-size: 11px; } .text-right { text-align: right; } .mr-1 { margin-right: 4px; }

.cell-flex { display: flex; align-items: center; gap: 10px; }
.flex-col-data { display: flex; flex-direction: column; align-items: flex-start; }
.icon-box { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; }
.bg-blue { background: #EFF6FF; color: #2563EB; } .bg-green { background: #ECFDF5; color: #10B981; } .bg-orange { background: #FFFBEB; color: #F59E0B; }

.truck-info { display: inline-flex; align-items: center; color: #D97706; font-size: 11px; font-weight: 700; margin-top: 6px; background: #FFFBEB; padding: 4px 8px; border-radius: 6px; border: 1px solid #FEF3C7;}

.status-pill { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.status-pill.pending_approval { background: #FFFBEB; color: #D97706; border: 1px solid #FEF3C7; }
.status-pill.approved { background: #F0FDF4; color: #15803D; border: 1px solid #DCFCE7; }
.status-pill.in_transit { background: #EFF6FF; color: #1D4ED8; border: 1px solid #DBEAFE; }
.status-pill.delivered { background: #F3F4F6; color: #4B5563; border: 1px solid #E5E7EB; }

/* Botones de Acción / Textos Huérfanos */
.actions-cell { display: flex; justify-content: flex-end; align-items: center; gap: 8px; }
.btn-action { display: flex; align-items: center; gap: 6px; border: none; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; color: white; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn-approve { background: #059669; } .btn-approve:hover:not(:disabled) { background: #047857; transform: translateY(-1px); }
.btn-dispatch { background: #EA580C; } .btn-dispatch:hover:not(:disabled) { background: #C2410C; transform: translateY(-1px); }
.btn-accelerate { background: #2563EB; } .btn-accelerate:hover:not(:disabled) { background: #1D4ED8; transform: translateY(-1px); }
.btn-action:disabled { opacity: 0.6; cursor: not-allowed; }

.flex-actions { display: flex; gap: 8px; justify-content: flex-end; align-items: center; }

.status-action-pill { display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; }
.status-action-pill.in-transit { background: #F3F4F6; color: #4B5563; }
.status-action-pill.processed { background: #F8FAFC; color: #94A3B8; border: 1px dashed #CBD5E1; }

.empty-state { text-align: center; padding: 60px 20px !important; color: var(--text-muted); }
.empty-icon { color: #D1D5DB; margin-bottom: 16px; }

/* ESTILOS DEL NUEVO MODAL DE CONFIRMACIÓN (GLASSMORPHISM) */
.modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(17, 24, 39, 0.4); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal-content.confirm-dialog { background: #FFFFFF; border-radius: 24px; width: 100%; max-width: 400px; padding: 32px 24px 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); display: flex; flex-direction: column; align-items: center; text-align: center; }
.dialog-icon-wrapper { width: 64px; height: 64px; background: #ECFDF5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
.text-emerald { color: #10B981; }
.dialog-title { margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #111827; }
.dialog-text { margin: 0 0 24px; font-size: 14px; color: #4B5563; line-height: 1.5; }
.dialog-footer { display: flex; gap: 12px; width: 100%; }
.dialog-footer button { flex: 1; justify-content: center; padding: 12px; font-size: 14px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px;}
.btn-cancel { background: white; border: 1px solid #D1D5DB; color: #374151; }
.btn-cancel:hover { background: #F9FAFB; border-color: #9CA3AF; }

.spinner { animation: spin 1s linear infinite; }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-active .modal-content { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-fade-enter-from .modal-content { opacity: 0; transform: translateY(20px) scale(0.96); }

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

/* ─── RESPONSIVE ─── */
@media (max-width: 768px) {
  .toolbar { flex-direction: column; align-items: stretch; gap: 12px; }
  .search-box { width: 100%; }
  .filter-tabs { width: 100%; overflow-x: auto; white-space: nowrap; padding-bottom: 4px; }
  .table-container { overflow-x: auto; }
  .premium-table { min-width: 800px; }
  .flex-actions { flex-direction: column; align-items: stretch; }
  .btn-action { width: 100%; justify-content: center; }
}
</style>