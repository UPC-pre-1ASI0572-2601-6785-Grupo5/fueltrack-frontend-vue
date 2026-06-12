<template>
  <Transition name="modal-fade">
    <div v-if="isOpen" class="modal-overlay">

      <div class="modal-content" ref="modalRef">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Asignación de Unidad Logística</h3>
            <p class="modal-subtitle">
              Pedido <strong class="text-blue">{{ orderId }}</strong> listo para despacho
            </p>
          </div>
          <button class="btn-close" @click="close" title="Cerrar (Esc)">
            <XIcon :size="20" />
          </button>
        </div>

        <form @submit.prevent="submitForm" class="modal-body">

          <Transition name="slide-down">
            <div v-if="errorMessage" class="error-alert">
              <AlertCircleIcon :size="16" class="error-icon" />
              <span>{{ errorMessage }}</span>
            </div>
          </Transition>

          <div class="form-group">
            <label>Seleccione la unidad disponible</label>
            <p class="hint-text mb-3">La unidad seleccionada recibirá la hoja de ruta en su aplicación móvil.</p>

            <div class="fleet-grid">
              <label
                  v-for="truck in availableFleet"
                  :key="truck.id"
                  :class="['fleet-card', { 'selected': selectedTruck === truck.id }]"
              >
                <input
                    type="radio"
                    name="truckSelect"
                    :value="truck.id"
                    v-model="selectedTruck"
                    class="hidden-radio"
                />
                <div class="fleet-card-content">
                  <div class="truck-icon-box">
                    <TruckIcon :size="24" />
                  </div>
                  <div class="truck-details">
                    <h4>{{ truck.name }}</h4>
                    <span class="plate">{{ truck.status }}</span>
                  </div>
                </div>
                <div v-if="selectedTruck === truck.id" class="check-indicator">
                  <CheckCircle2Icon :size="20" />
                </div>
              </label>
            </div>
          </div>

        </form>

        <div class="modal-footer">
          <button type="button" class="btn-cancel" @click="close" :disabled="orderStore.isSaving">
            Cancelar
          </button>
          <button
              type="button"
              class="btn-submit btn-dispatch"
              @click="submitForm"
              :disabled="orderStore.isSaving || !selectedTruck"
          >
            <Loader2Icon v-if="orderStore.isSaving" :size="16" class="spinner" />
            <NavigationIcon v-else :size="16" />
            {{ orderStore.isSaving ? 'Iniciando Ruta...' : 'Iniciar Ruta de Entrega' }}
          </button>
        </div>
      </div>

    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { toast } from 'vue-sonner';
import { useOrderStore } from '../../application/stores/orderStore';
import { useFleetStore } from '../../application/stores/fleetStore';
import {
  XIcon, AlertCircleIcon, Loader2Icon,
  NavigationIcon, TruckIcon, CheckCircle2Icon
} from 'lucide-vue-next';

const props = defineProps({
  isOpen: Boolean,
  orderId: String
});
const emit = defineEmits(['close']);

const orderStore = useOrderStore();
const fleetStore = useFleetStore();
const modalRef = ref(null);
const errorMessage = ref('');
const selectedTruck = ref('');

const availableFleet = computed(() =>
    fleetStore.vehicles.map(v => ({ id: v.plate, name: v.plate, status: v.status }))
);

watch(() => props.isOpen, (open) => {
  if (open) fleetStore.fetchVehicles();
});

// UX Premium: Click afuera para cerrar
onClickOutside(modalRef, () => {
  if (props.isOpen && !orderStore.isSaving) close();
});

// UX Premium: Tecla Escape para cerrar
const handleKeydown = (e) => {
  if (e.key === 'Escape' && props.isOpen && !orderStore.isSaving) close();
};

onMounted(() => document.addEventListener('keydown', handleKeydown));
onUnmounted(() => document.removeEventListener('keydown', handleKeydown));

const close = () => {
  errorMessage.value = '';
  selectedTruck.value = '';
  emit('close');
};

const submitForm = async () => {
  if (!selectedTruck.value) {
    errorMessage.value = 'Debes seleccionar una unidad logística.';
    return;
  }

  errorMessage.value = '';

  const truckId = selectedTruck.value;
  close(); // Cerramos visualmente para dar respuesta inmediata

  toast.promise(
      new Promise(async (resolve, reject) => {
        const result = await orderStore.dispatchOrder(props.orderId, truckId);
        if(result.success) resolve(result);
        else reject(new Error(result.message));
      }),
      {
        loading: `Transmitiendo ruta a la unidad ${truckId}...`,
        success: `Despacho iniciado. La unidad ${truckId} está en ruta.`,
        error: 'Error al intentar asignar la cisterna.'
      }
  );
};
</script>

<style scoped>
/* Glassmorphism Background */
.modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(17, 24, 39, 0.4); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}

.modal-content {
  background: #FFFFFF; border-radius: 24px;
  width: 100%; max-width: 520px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(229, 231, 235, 0.5);
  display: flex; flex-direction: column;
}

.modal-header { padding: 24px 24px 16px; display: flex; justify-content: space-between; align-items: flex-start; }
.modal-title { margin: 0 0 4px; font-size: 18px; font-weight: 800; color: #111827; }
.modal-subtitle { margin: 0; font-size: 13px; color: #6B7280; }
.text-blue { color: #2563EB; font-family: monospace; font-size: 14px;}

.btn-close {
  background: #F3F4F6; border: none; padding: 6px; border-radius: 50%;
  color: #6B7280; cursor: pointer; transition: all 0.2s; display: flex;
}
.btn-close:hover { background: #E5E7EB; color: #111827; transform: rotate(90deg); }

.modal-body { padding: 0 24px 12px; display: flex; flex-direction: column; gap: 16px; }
.form-group label { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 4px; display: block;}
.hint-text { margin: 0; font-size: 13px; color: #6B7280; }
.mb-3 { margin-bottom: 12px; }

/* Tarjetas Seleccionables - CORREGIDAS */
.fleet-grid { display: flex; flex-direction: column; gap: 12px; }
.hidden-radio { position: absolute; opacity: 0; pointer-events: none; }

.fleet-card {
  position: relative; background: #FFFFFF;
  border: 2px solid #E5E7EB; border-radius: 16px;
  /* Parche 1: Padding derecho extendido a 48px para proteger la zona del ícono */
  padding: 16px 48px 16px 16px;
  cursor: pointer; transition: all 0.2s ease;
}
.fleet-card:hover { border-color: #D1D5DB; background: #F9FAFB; }
.fleet-card.selected { border-color: #EA580C; background: #FFF7ED; }

.fleet-card-content { display: flex; align-items: center; gap: 16px; }

.truck-icon-box {
  width: 48px; height: 48px; border-radius: 12px; background: #F3F4F6;
  display: flex; align-items: center; justify-content: center; color: #6B7280; transition: all 0.2s;
}
.fleet-card.selected .truck-icon-box { background: #FFEDD5; color: #EA580C; }

.truck-details { flex: 1; }
.truck-details h4 { margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #111827; }
.plate { font-family: monospace; font-size: 12px; color: #6B7280; background: #F3F4F6; padding: 2px 6px; border-radius: 4px; }
.fleet-card.selected .plate { background: #FFEDD5; color: #9A3412; }

/* Parche 2: Capacidad alineada estrictamente a la derecha */
.truck-capacity { text-align: right; display: flex; flex-direction: column; align-items: flex-end; }
.cap-value { font-size: 16px; font-weight: 800; color: #111827; line-height: 1.2; }
.cap-unit { font-size: 11px; font-weight: 600; color: #9CA3AF; text-transform: uppercase; }

/* Parche 3: Check centrado verticalmente con la animación ajustada */
.check-indicator {
  position: absolute;
  top: 50%;
  right: 16px;
  color: #EA580C;
  animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.error-alert { background: #FEF2F2; border: 1px solid #FEE2E2; padding: 12px; border-radius: 10px; color: #991B1B; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 8px; }
.error-icon { color: #DC2626; }

/* Footer */
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 20px 24px; border-top: 1px solid #F3F4F6; background: #F9FAFB; border-radius: 0 0 24px 24px; }

.btn-cancel { padding: 10px 16px; background: white; border: 1px solid #D1D5DB; border-radius: 10px; font-size: 14px; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover:not(:disabled) { background: #F3F4F6; }

.btn-submit { display: flex; align-items: center; gap: 8px; padding: 10px 18px; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; color: white; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
.btn-dispatch { background: #EA580C; }
.btn-dispatch:hover:not(:disabled) { background: #C2410C; transform: translateY(-1px); }
.btn-submit:disabled, .btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.spinner { animation: spin 1s linear infinite; }

/* Animaciones */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-active .modal-content { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-fade-enter-from .modal-content { opacity: 0; transform: translateY(20px) scale(0.96); }

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* Animación corregida para mantener el centrado vertical */
@keyframes popIn {
  0% { transform: translateY(-50%) scale(0.5); opacity: 0; }
  100% { transform: translateY(-50%) scale(1); opacity: 1; }
}
</style>