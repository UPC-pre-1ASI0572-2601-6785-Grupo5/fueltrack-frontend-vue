<template>
  <div class="cockpit-dashboard">
    <header class="dashboard-top">
      <div class="header-left">
        <h1 class="welcome-title">Emisión de Orden (B2B)</h1>
        <p class="date-text">Requerimiento de abastecimiento con cargo a línea de crédito</p>
      </div>
      <div class="header-actions">
        <button class="liquid-btn btn-secondary" @click="router.push('/client/orders')">
          <ArrowLeftIcon :size="14" /> Cancelar Operación
        </button>
      </div>
    </header>

    <div class="main-layout-grid fade-in-up" style="animation-delay: 0.1s">

      <div class="glass-card flex-col stepper-panel">
        <div class="stepper-vertical">
          <div v-for="n in 3" :key="n" class="step-item" :class="{ 'active': step === n, 'completed': step > n }">
            <div class="step-circle">
              <CheckIcon v-if="step > n" :size="14" stroke-width="3" />
              <span v-else>{{ n }}</span>
            </div>
            <div class="step-content">
              <span class="step-lbl">Paso {{ n }}</span>
              <span class="step-title">{{ stepLabels[n-1] }}</span>
            </div>
            <div v-if="n < 3" class="step-line" :class="{'filled': step > n}"></div>
          </div>
        </div>

        <div class="live-quote-box mt-auto">
          <div class="quote-header">
            <CalculatorIcon :size="14" class="text-blue"/>
            <span>Proyección Financiera</span>
          </div>
          <div class="quote-body">
            <div class="quote-row">
              <span class="q-lbl">Volumen Neto</span>
              <span class="q-val">{{ (formData.gallons || 0).toLocaleString() }} gal</span>
            </div>
            <div class="quote-row">
              <span class="q-lbl">Precio Base (Indexado)</span>
              <span class="q-val">S/ {{ currentPrice.toFixed(2) }} <small>/gal</small></span>
            </div>
            <div class="quote-divider"></div>
            <div class="quote-total">
              <span>Total Estimado (Sin IGV)</span>
              <span class="text-blue">S/ {{ estimatedTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 }) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="glass-card flex-fill flex-col form-panel">
        <div class="internal-scroll form-content">
          <transition name="fade-slide" mode="out-in">

            <div v-if="step === 1" key="1" class="step-container">
              <h3 class="section-title">Especificación del Producto</h3>
              <p class="section-desc">Selecciona el carburante según la normativa de tu operación.</p>

              <div class="fuel-grid">
                <div v-for="fuel in fuelOptions" :key="fuel.id" class="fuel-option liquid-item" :class="{ 'selected': formData.fuelType === fuel.name }" @click="selectFuel(fuel)">
                  <div class="fuel-icon" :style="{ color: fuel.color, backgroundColor: fuel.bg }"><DropletIcon :size="24" /></div>
                  <div class="fuel-info">
                    <span class="name">{{ fuel.name }}</span>
                    <span class="desc">{{ fuel.desc }}</span>
                  </div>
                  <div class="radio-check"><div class="radio-dot"></div></div>
                  <div class="price-tag">S/ {{ fuel.price }}/gal</div>
                </div>
              </div>

              <div class="form-group mt-4">
                <label>Volumen a Despachar (Galones)</label>
                <div class="input-container">
                  <input type="number" v-model="formData.gallons" placeholder="Volumen mínimo de atención: 500 galones..." min="500">
                  <span class="unit">GAL</span>
                </div>
              </div>
            </div>

            <div v-else-if="step === 2" key="2" class="step-container">
              <h3 class="section-title">Imputación y Despliegue</h3>
              <p class="section-desc">Asigna el gasto al centro de costos y define la ventana de entrega.</p>

              <div class="form-grid mb-3">
                <div class="form-group">
                  <label>Centro de Costos / OT</label>
                  <div class="input-with-icon">
                    <BriefcaseIcon :size="16" class="icon-input" />
                    <input type="text" v-model="formData.costCenter" placeholder="Ej: OT-7784-MANTENIMIENTO">
                  </div>
                </div>
                <div class="form-group">
                  <label>Orden de Compra (ERP)</label>
                  <div class="input-with-icon">
                    <FileTextIcon :size="16" class="icon-input" />
                    <input type="text" v-model="formData.documentRef" placeholder="Ej: OC-SAP-2026-001">
                  </div>
                </div>
              </div>

              <div class="form-group mb-3">
                <label>Sede de Descarga</label>
                <div class="input-with-icon">
                  <MapPinIcon :size="16" class="icon-input" />
                  <select v-model="formData.location">
                    <option value="" disabled>Seleccione instalación autorizada...</option>
                    <option>Minera Yanacocha - Tajo Abierto Norte</option>
                    <option>Nodo Telecom Amazonas - Chiriaco</option>
                    <option>Planta Concentradora Principal</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Ventana de Atención (SLA)</label>
                <div class="input-with-icon">
                  <ClockIcon :size="16" class="icon-input" />
                  <select v-model="formData.slaWindow">
                    <option value="" disabled>Requerimiento de entrega...</option>
                    <option>Estándar (48 horas hábiles)</option>
                    <option>Prioritario (24 horas hábiles)</option>
                    <option>Urgencia Operativa (Mismo día - Turno Noche)</option>
                  </select>
                </div>
              </div>
            </div>

            <div v-else key="3" class="step-container">
              <h3 class="section-title">Validación de Orden de Servicio</h3>
              <p class="section-desc">Revisa la proforma antes de comprometer tu línea de crédito.</p>

              <div class="receipt-box">
                <div class="receipt-header">
                  <ShieldCheckIcon :size="16" class="text-white" />
                  <h4>Proforma Autorizada - Contrato Marco</h4>
                </div>
                <div class="receipt-body">
                  <div class="review-item"><span class="label">Producto Técnico</span><span class="value text-blue font-bold">{{ formData.fuelType }}</span></div>
                  <div class="review-item"><span class="label">Volumen Neto</span><span class="value">{{ Number(formData.gallons).toLocaleString() }} galones</span></div>
                  <div class="receipt-divider"></div>
                  <div class="review-item"><span class="label">Imputación Financiera</span><span class="value bg-gray">{{ formData.costCenter }}</span></div>
                  <div class="review-item"><span class="label">Orden de Compra</span><span class="value font-mono">{{ formData.documentRef }}</span></div>
                  <div class="receipt-divider"></div>
                  <div class="review-item"><span class="label">Destino</span><span class="value">{{ formData.location }}</span></div>
                  <div class="review-item"><span class="label">SLA Requerido</span><span class="value">{{ formData.slaWindow }}</span></div>
                </div>
                <div class="receipt-footer">
                  <span>Impacto a Línea de Crédito:</span>
                  <h3>S/ {{ estimatedTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 }) }}</h3>
                </div>
              </div>
            </div>

          </transition>
        </div>

        <div class="form-actions">
          <button class="liquid-btn btn-secondary" @click="prevStep" :style="{ visibility: step === 1 ? 'hidden' : 'visible' }">
            Atrás
          </button>

          <button class="liquid-btn btn-primary" @click="nextStep" v-if="step < 3">
            Continuar <ChevronRightIcon :size="16" />
          </button>

          <button class="liquid-btn btn-submit" @click="submitOrder" v-if="step === 3" :disabled="orderStore.isSaving">
            <Loader2Icon v-if="orderStore.isSaving" class="spinner" :size="16" />
            <span v-else>Confirmar y Autorizar Gasto</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useOrderStore } from '@/modules/order-management/application/stores/orderStore';
import { toast } from 'vue-sonner';
import {
  ArrowLeftIcon, DropletIcon, CheckIcon, MapPinIcon, ClockIcon, FileTextIcon, ChevronRightIcon,
  BriefcaseIcon, CalculatorIcon, ShieldCheckIcon, Loader2Icon
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const orderStore = useOrderStore();

const step = ref(1);
const stepLabels = ['Especificación', 'Imputación', 'Autorización'];

const formData = ref({
  fuelType: 'Diesel B5 S-50',
  gallons: '',
  location: '',
  documentRef: '',
  costCenter: '',
  slaWindow: ''
});

// Precios simulados del día
const fuelOptions = [
  { id: 1, name: 'Diesel B5 S-50', desc: 'Bajo azufre (Norma Minera)', price: 16.45, color: '#2563eb', bg: '#eff6ff' },
  { id: 2, name: 'Gasohol 95 Plus', desc: 'Vehículos de supervisión', price: 18.20, color: '#10b981', bg: '#ecfdf5' },
  { id: 3, name: 'Diésel Marino', desc: 'Generadores estacionarios', price: 15.90, color: '#f59e0b', bg: '#fffbeb' }
];

const currentPrice = ref(fuelOptions[0].price);

const selectFuel = (fuel) => {
  formData.value.fuelType = fuel.name;
  currentPrice.value = fuel.price;
};

const estimatedTotal = computed(() => {
  const gal = Number(formData.value.gallons) || 0;
  return gal * currentPrice.value;
});

// PEDIDO EXPRESS
onMounted(() => {
  if (route.query.express === 'true') {
    toast.info('Modo Express: Autocompletando datos históricos.');
    formData.value.fuelType = 'Diesel B5 S-50';
    currentPrice.value = 16.45;
    formData.value.gallons = 5000;
    formData.value.location = 'Minera Yanacocha - Tajo Abierto Norte';
    formData.value.documentRef = 'OC-SAP-EXPRESS';
    formData.value.costCenter = 'OT-MANT-EQUIPOS';
    formData.value.slaWindow = 'Prioritario (24 horas hábiles)';
    step.value = 3;
  }
});

const nextStep = () => {
  if (step.value === 1 && (!formData.value.gallons || formData.value.gallons < 500)) {
    toast.error('Requerimiento Inválido', { description: 'Por contrato B2B, el despacho mínimo es 500 gal.' });
    return;
  }
  if (step.value === 2 && (!formData.value.location || !formData.value.documentRef || !formData.value.costCenter || !formData.value.slaWindow)) {
    toast.error('Imputación Incompleta', { description: 'Debe justificar financieramente el pedido y elegir ventana SLA.' });
    return;
  }
  step.value++;
};

const prevStep = () => step.value--;

const submitOrder = async () => {
  const res = await orderStore.createNewOrder({
    fuelType: formData.value.fuelType,
    gallons: formData.value.gallons,
    documentRef: formData.value.documentRef
  });

  if (res.success) {
    toast.success('Orden Procesada', { description: 'Impacto registrado en la línea de crédito.' });
    router.push('/client/orders');
  } else {
    toast.error('Error de Integración', { description: res.message });
  }
};
</script>

<style scoped>
/* ─── BASE ZERO SCROLL ─── */
.cockpit-dashboard { font-family: 'Inter', sans-serif; color: #0f172a; display: flex; flex-direction: column; gap: 20px; height: 100%; max-height: 100%; overflow: hidden; }

/* ─── HEADER ─── */
.dashboard-top { display: flex; justify-content: space-between; align-items: flex-end; flex-shrink: 0;}
.header-left { display: flex; flex-direction: column; gap: 4px;}
.welcome-title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px;}
.date-text { color: #64748b; font-size: 13px; margin: 0; font-weight: 600;}
.header-actions { display: flex; gap: 12px; }

.liquid-btn { display: flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.2s; border: none; justify-content: center;}
.btn-primary { background: #0f172a; color: white; box-shadow: 0 4px 12px rgba(15,23,42,0.15);}
.btn-primary:hover { background: #1e293b; transform: translateY(-2px); }
.btn-secondary { background: white; border: 1px solid #cbd5e1; color: #0f172a; }
.btn-secondary:hover { background: #f8fafc; border-color: #94a3b8; transform: translateY(-2px); }
.btn-submit { background: #2563eb; color: white; box-shadow: 0 4px 15px rgba(37,99,235,0.25); min-width: 220px;}
.btn-submit:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-2px); }
.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

/* ─── WIZARD LAYOUT (1fr / 2.5fr) ─── */
.main-layout-grid { display: grid; grid-template-columns: 1fr 2.5fr; gap: 20px; flex: 1; min-height: 0; }
.glass-card { background: white; border-radius: 20px; padding: 24px; border: 1px solid #f1f5f9; box-shadow: 0 10px 30px rgba(0,0,0,0.03); display: flex; flex-direction: column;}
.flex-fill { flex: 1; min-height: 0; }
.flex-col { display: flex; flex-direction: column; }

/* ─── STEPPER VERTICAL (Izquierda) ─── */
.stepper-panel { justify-content: flex-start; gap: 30px;}
.stepper-vertical { display: flex; flex-direction: column; gap: 0;}
.step-item { display: flex; align-items: flex-start; gap: 16px; position: relative; min-height: 80px;}
.step-circle { width: 32px; height: 32px; border-radius: 50%; background: white; border: 2px solid #cbd5e1; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-weight: 800; font-size: 13px; position: relative; z-index: 2; transition: 0.3s;}
.step-content { display: flex; flex-direction: column; padding-top: 6px;}
.step-lbl { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 2px;}
.step-title { font-size: 14px; font-weight: 700; color: #64748b; transition: 0.3s;}
.step-line { position: absolute; left: 15px; top: 32px; bottom: 0; width: 2px; background: #e2e8f0; z-index: 1;}

.step-item.active .step-circle { border-color: #2563eb; color: #2563eb; box-shadow: 0 0 0 4px rgba(37,99,235,0.15); transform: scale(1.1);}
.step-item.active .step-title { color: #0f172a; font-weight: 800;}
.step-item.completed .step-circle { background: #2563eb; border-color: #2563eb; color: white; }
.step-line.filled { background: #2563eb; }

/* Cotizador en vivo */
.mt-auto { margin-top: auto; }
.live-quote-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px;}
.quote-header { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; color: #0f172a; margin-bottom: 12px; text-transform: uppercase;}
.quote-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px;}
.q-lbl { color: #64748b; font-weight: 600;}
.q-val { color: #0f172a; font-weight: 700;}
.quote-divider { border-bottom: 1px dashed #cbd5e1; margin: 12px 0;}
.quote-total { display: flex; flex-direction: column; gap: 4px; font-size: 12px; font-weight: 700; color: #64748b;}
.quote-total .text-blue { font-size: 20px; font-weight: 800; color: #2563eb;}

/* ─── FORMULARIO (Derecha) ─── */
.internal-scroll { flex: 1; overflow-y: auto; padding-right: 12px; padding-bottom: 20px;}
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

.section-title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
.section-desc { font-size: 13px; color: #64748b; margin: 0 0 24px 0; }

/* Opciones de Combustible */
.fuel-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.liquid-item { border: 2px solid #f1f5f9; padding: 20px; border-radius: 16px; background: white; cursor: pointer; transition: 0.2s; position: relative; text-align: center; display: flex; flex-direction: column;}
.liquid-item:hover { border-color: #cbd5e1; box-shadow: 0 10px 20px rgba(0,0,0,0.03); transform: translateY(-2px);}
.liquid-item.selected { border-color: #2563eb; background: #f8fafc; box-shadow: 0 4px 12px rgba(37,99,235,0.1);}

.fuel-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
.fuel-info .name { display: block; font-weight: 800; color: #0f172a; font-size: 14px;}
.fuel-info .desc { font-size: 11px; color: #64748b; margin-top: 4px; display: block;}
.price-tag { margin-top: auto; padding-top: 12px; font-size: 13px; font-weight: 800; color: #3b82f6;}

.radio-check { position: absolute; top: 12px; right: 12px; width: 18px; height: 18px; border: 2px solid #cbd5e1; border-radius: 50%; display: flex; align-items: center; justify-content: center;}
.radio-dot { width: 8px; height: 8px; background: white; border-radius: 50%; opacity: 0; transition: 0.2s;}
.selected .radio-check { border-color: #2563eb; background: #2563eb; }
.selected .radio-dot { opacity: 1; }

/* Inputs */
.mt-4 { margin-top: 24px; }
.mb-3 { margin-bottom: 20px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;}
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

.input-container, .input-with-icon { position: relative; display: flex; align-items: center; }
.input-container input, .input-with-icon input, .input-with-icon select {
  width: 100%; padding: 12px 16px; border: 2px solid #f1f5f9; border-radius: 12px; font-size: 14px; font-weight: 600; color: #0f172a; background: #f8fafc; transition: 0.2s; outline: none;
}
.input-with-icon input, .input-with-icon select { padding-left: 40px; }
.icon-input { position: absolute; left: 14px; color: #94a3b8; pointer-events: none; }
.unit { position: absolute; right: 16px; color: #64748b; font-weight: 800; font-size: 12px; }
input:focus, select:focus { border-color: #3b82f6 !important; background: white !important; box-shadow: 0 0 0 4px rgba(59,130,246,0.1); }

/* Proforma Ticket */
.receipt-box { background: white; border: 2px solid #f1f5f9; border-radius: 16px; overflow: hidden; margin-top: 20px;}
.receipt-header { background: #0f172a; padding: 16px 20px; display: flex; align-items: center; gap: 10px; color: white;}
.receipt-header h4 { margin: 0; font-size: 14px; font-weight: 800; letter-spacing: 0.5px;}
.receipt-body { padding: 20px; display: flex; flex-direction: column; gap: 12px;}
.review-item { display: flex; justify-content: space-between; align-items: center; font-size: 13px;}
.review-item .label { color: #64748b; font-weight: 700; }
.review-item .value { color: #0f172a; font-weight: 600; }
.receipt-divider { border-bottom: 1px dashed #cbd5e1; margin: 4px 0;}
.text-blue { color: #2563eb; } .font-bold { font-weight: 800; font-size: 14px !important;}
.font-mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }
.bg-gray { background: #f1f5f9; padding: 4px 8px; border-radius: 6px; }

.receipt-footer { background: #f8fafc; padding: 16px 20px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: center;}
.receipt-footer span { font-size: 12px; font-weight: 700; color: #64748b;}
.receipt-footer h3 { margin: 0; font-size: 22px; font-weight: 800; color: #2563eb;}

/* Footer de Acciones */
.form-actions { display: flex; justify-content: space-between; padding-top: 20px; border-top: 1px solid #f1f5f9; margin-top: 10px; flex-shrink: 0;}

/* Animaciones */
.fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; transform: translateY(10px); }
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.fade-slide-enter-from { opacity: 0; transform: translateX(20px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-20px); }
.spinner { animation: spin 1s linear infinite; }
@keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 1024px) {
  .cockpit-dashboard { height: auto; overflow: visible; }
  .main-layout-grid { grid-template-columns: 1fr; }
  .stepper-panel { display: none; }
  .internal-scroll { overflow: visible; }
}
</style>