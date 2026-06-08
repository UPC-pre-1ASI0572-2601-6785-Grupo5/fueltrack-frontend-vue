<template>
  <Transition name="modal-fade">
    <div v-if="isOpen" class="modal-overlay">

      <div class="modal-content" ref="modalRef">

        <div class="modal-header">
          <div>
            <h3 class="modal-title">Nuevo Pedido de Combustible</h3>
            <p class="modal-subtitle">Completa los datos para iniciar el despacho</p>
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
            <label>Producto a solicitar</label>
            <div class="input-wrapper">
              <div class="input-icon"><DropletIcon :size="18" /></div>
              <select v-model="form.fuelType" required class="premium-input pl-10">
                <option value="" disabled>Seleccione el tipo de combustible</option>
                <option value="Diesel B5 S-50">Diesel B5 S-50 (Bajo azufre)</option>
                <option value="Gasohol 95 Plus">Gasohol 95 Plus</option>
                <option value="Diésel Marino">Diésel Marino</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Volumen requerido <span class="text-optional">(Galones)</span></label>
            <div class="input-wrapper">
              <div class="input-icon"><HashIcon :size="18" /></div>
              <input
                  type="number"
                  v-model="form.gallons"
                  required
                  min="10"
                  placeholder="Ej. 500"
                  class="premium-input pl-10"
              />
            </div>
            <p class="hint-text">
              <InfoIcon :size="12" class="inline-icon" />
              El pedido mínimo por logística es de 10 galones.
            </p>
          </div>

          <div class="form-group">
            <label>Documento de Referencia</label>
            <div class="input-wrapper">
              <div class="input-icon"><FileTextIcon :size="18" /></div>
              <input
                  type="text"
                  v-model="form.documentRef"
                  required
                  placeholder="N° de OC o Voucher (Ej. OC-987654)"
                  class="premium-input pl-10"
              />
            </div>
            <p class="hint-text">Requerido para la validación financiera del proveedor.</p>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="close" :disabled="orderStore.isSaving">
              Cancelar
            </button>
            <button type="submit" class="btn-submit" :disabled="orderStore.isSaving">
              <Loader2Icon v-if="orderStore.isSaving" :size="16" class="spinner" />
              <CheckIcon v-else :size="16" />
              {{ orderStore.isSaving ? 'Procesando...' : 'Confirmar Solicitud' }}
            </button>
          </div>

        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { toast } from 'vue-sonner';
import { useOrderStore } from '../../application/stores/orderStore';
import {
  XIcon, DropletIcon, HashIcon, FileTextIcon,
  InfoIcon, AlertCircleIcon, Loader2Icon, CheckIcon
} from 'lucide-vue-next';

const props = defineProps({ isOpen: Boolean });
const emit = defineEmits(['close']);

const orderStore = useOrderStore();
const modalRef = ref(null);
const errorMessage = ref('');

const form = reactive({
  fuelType: '',
  gallons: '',
  documentRef: ''
});

// UX Premium: Cerrar al hacer clic fuera del modal usando VueUse
onClickOutside(modalRef, () => {
  if (props.isOpen && !orderStore.isSaving) close();
});

// UX Premium: Cerrar con la tecla Escape
const handleKeydown = (e) => {
  if (e.key === 'Escape' && props.isOpen && !orderStore.isSaving) close();
};

onMounted(() => document.addEventListener('keydown', handleKeydown));
onUnmounted(() => document.removeEventListener('keydown', handleKeydown));

const close = () => {
  errorMessage.value = '';
  form.fuelType = '';
  form.gallons = '';
  form.documentRef = '';
  emit('close');
};

const submitForm = async () => {
  errorMessage.value = '';

  const result = await orderStore.createNewOrder({
    fuelType: form.fuelType,
    gallons: Number(form.gallons),
    documentRef: form.documentRef
  });

  if (result.success) {
    // Notificación elegante integrada con el Dashboard
    toast.success('Pedido creado exitosamente', {
      description: `${form.gallons} galones de ${form.fuelType} solicitados.`
    });
    close();
  } else {
    errorMessage.value = result.message;
    toast.error('Error al procesar el pedido');
  }
};
</script>

<style scoped>
/* 1. Fondo Glassmorphism */
.modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(17, 24, 39, 0.4); /* Gris muy oscuro semi-transparente */
  backdrop-filter: blur(6px); /* El desenfoque estilo Apple */
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}

/* 2. Tarjeta del Modal */
.modal-content {
  background: #FFFFFF;
  border-radius: 24px; /* Bordes suaves premium */
  width: 100%; max-width: 460px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(229, 231, 235, 0.5);
  overflow: hidden;
  display: flex; flex-direction: column;
}

/* Header */
.modal-header {
  padding: 24px 24px 16px;
  display: flex; justify-content: space-between; align-items: flex-start;
}
.modal-title { margin: 0 0 4px; font-size: 18px; font-weight: 800; color: #111827; }
.modal-subtitle { margin: 0; font-size: 13px; color: #6B7280; }
.btn-close {
  background: #F3F4F6; border: none; padding: 6px; border-radius: 50%;
  color: #6B7280; cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; justify-content: center;
}
.btn-close:hover { background: #E5E7EB; color: #111827; transform: rotate(90deg); }

/* Body y Formulario */
.modal-body { padding: 0 24px 24px; display: flex; flex-direction: column; gap: 20px; }

.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 13px; font-weight: 600; color: #374151; }
.text-optional { color: #9CA3AF; font-weight: 400; font-size: 12px; }

/* 3. Inputs Premium (Focus Rings y Iconos) */
.input-wrapper { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 12px; color: #9CA3AF; pointer-events: none; display: flex; }
.pl-10 { padding-left: 36px !important; }

.premium-input {
  width: 100%; padding: 10px 14px;
  background: #FFFFFF; border: 1px solid #D1D5DB; border-radius: 10px;
  font-size: 14px; color: #111827; outline: none;
  transition: all 0.2s ease;
}
.premium-input::placeholder { color: #9CA3AF; }
.premium-input:hover { border-color: #9CA3AF; }
/* La magia del Focus Ring */
.premium-input:focus { border-color: #2563EB; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }

/* Textos de ayuda y errores */
.hint-text { margin: 0; font-size: 12px; color: #6B7280; display: flex; align-items: center; gap: 4px; }
.inline-icon { color: #9CA3AF; }

.error-alert {
  background: #FEF2F2; border: 1px solid #FEE2E2; padding: 12px;
  border-radius: 10px; color: #991B1B; font-size: 13px; font-weight: 500;
  display: flex; align-items: center; gap: 8px;
}
.error-icon { color: #DC2626; }

/* Footer y Botones */
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; padding-top: 20px; border-top: 1px solid #F3F4F6; }

.btn-cancel {
  padding: 10px 16px; background: white; border: 1px solid #D1D5DB; border-radius: 10px;
  font-size: 14px; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s;
}
.btn-cancel:hover:not(:disabled) { background: #F9FAFB; border-color: #9CA3AF; }

.btn-submit {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 18px; background: #2563EB; border: none; border-radius: 10px;
  font-size: 14px; font-weight: 600; color: white; cursor: pointer; transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
}
.btn-submit:hover:not(:disabled) { background: #1D4ED8; transform: translateY(-1px); }
.btn-submit:disabled, .btn-cancel:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner { animation: spin 1s linear infinite; }

/* 4. Animaciones de Vue (Transitions) */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-active .modal-content { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-fade-leave-active .modal-content { transition: all 0.2s ease-in; }
.modal-fade-enter-from .modal-content { opacity: 0; transform: translateY(20px) scale(0.96); }
.modal-fade-leave-to .modal-content { opacity: 0; transform: translateY(10px) scale(0.98); }

.slide-down-enter-active, .slide-down-leave-active { transition: all 0.3s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-10px); }

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>