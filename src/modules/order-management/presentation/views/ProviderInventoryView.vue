<template>
  <div class="inventory-view">
    <div class="header-section">
      <div>
        <h2 class="page-title">Inventario de Planta</h2>
        <p class="page-subtitle">Monitoreo de tanques de almacenamiento y telemetría en tiempo real</p>
      </div>
      <button class="btn-primary" @click="openRefillModal">
        <RefreshCwIcon :size="18" /> Gestionar Suministro
      </button>
    </div>

    <div class="tanks-grid">
      <div v-for="stock in inventoryStore.stocks" :key="stock.fuelType" class="tank-card">

        <div class="tank-header">
          <div class="tank-title-group">
            <h4>{{ stock.fuelType }}</h4>
            <span class="sensor-status"><CheckCircle2Icon :size="12" /> Sensores OK</span>
          </div>
          <span :class="['status-tag', getLevelClass(stock.fuelType)]">
            {{ inventoryStore.getPercentage(stock.fuelType).toFixed(0) }}%
          </span>
        </div>

        <div class="tank-wrapper">
          <div class="tank-glass">
            <div
                class="tank-liquid"
                :class="getLevelClass(stock.fuelType)"
                :style="{ height: inventoryStore.getPercentage(stock.fuelType) + '%' }"
            >
              <div class="liquid-surface"></div>
            </div>
          </div>

          <div class="tank-markers">
            <div class="marker top"><span>50k</span></div>
            <div class="marker mid"><span>25k</span></div>
            <div class="marker bot"><span>0</span></div>
          </div>
        </div>

        <div class="inbound-alert" v-if="inventoryStore.getPercentage(stock.fuelType) < 40">
          <TruckIcon :size="14" />
          <span>En tránsito: 10,000 gal (Repsol Pampilla)</span>
        </div>

        <div class="tank-stats">
          <div class="stat">
            <span class="label">Volumen Disponible</span>
            <span class="value">{{ stock.currentGallons.toLocaleString() }} <small>gal</small></span>
          </div>
          <div class="stat">
            <span class="label">Capacidad Libre</span>
            <span class="value text-muted">{{ (stock.maxCapacityGallons - stock.currentGallons).toLocaleString() }} gal</span>
          </div>
        </div>

        <div class="telemetry-grid">
          <div class="telemetry-item">
            <ThermometerIcon :size="14" class="text-muted" />
            <div class="telemetry-data">
              <span class="label">Temp. Interna</span>
              <span class="value">{{ getTelemetryData(stock.fuelType).temp }}°C</span>
            </div>
          </div>
          <div class="telemetry-item">
            <GaugeIcon :size="14" class="text-muted" />
            <div class="telemetry-data">
              <span class="label">Presión / Densidad</span>
              <span class="value">{{ getTelemetryData(stock.fuelType).density }} API</span>
            </div>
          </div>
        </div>

      </div>
    </div>

    <Teleport to="body">
      <div v-if="showRefillModal" class="modal-overlay" @click.self="closeRefillModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Recepción de Combustible</h3>
            <button class="btn-close" @click="closeRefillModal"><XIcon :size="20" /></button>
          </div>
          <div class="modal-body">
            <p class="modal-desc">Ingresa el volumen recibido desde la refinería para actualizar el inventario físico.</p>

            <div class="form-group">
              <label>Tanque de Destino</label>
              <select v-model="refillData.type" class="form-input">
                <option value="Diesel B5 S-50">Tanque 01 - Diesel B5 S-50</option>
                <option value="Gasohol 95 Plus">Tanque 02 - Gasohol 95 Plus</option>
                <option value="Diésel Marino">Tanque 03 - Diésel Marino</option>
              </select>
            </div>

            <div class="form-group">
              <label>Volumen Recibido (Galones)</label>
              <input type="number" v-model.number="refillData.amount" class="form-input" placeholder="Ej: 10000" />
            </div>

            <div v-if="willExceedCapacity" class="alert-error">
              <AlertCircleIcon :size="16" />
              <span>Esta recarga excede la capacidad libre del tanque (Máx {{ freeCapacity.toLocaleString() }} gal).</span>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeRefillModal">Cancelar</button>
            <button class="btn-primary" @click="submitRefill" :disabled="willExceedCapacity || refillData.amount <= 0">
              Confirmar Recepción
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useInventoryStore } from '../../application/stores/inventoryStore.js';
import { useNotificationStore } from '../../../order-management/application/stores/notificationStore.js';
import { toast } from 'vue-sonner';
import {
  RefreshCwIcon, CheckCircle2Icon, ThermometerIcon, GaugeIcon,
  TruckIcon, XIcon, AlertCircleIcon
} from 'lucide-vue-next';

const inventoryStore = useInventoryStore();
const notificationStore = useNotificationStore();

onMounted(() => inventoryStore.fetchStocks());

const getLevelClass = (fuelType) => {
  const p = inventoryStore.getPercentage(fuelType);
  if (p < 20) return 'critical';
  if (p < 50) return 'warning';
  return 'optimal';
};

const getTelemetryData = (fuelType) => {
  const data = {
    'Diesel B5 S-50':  { temp: 18.5, density: 35.2 },
    'Gasohol 95 Plus': { temp: 21.0, density: 55.4 },
    'Diésel Marino':   { temp: 20.5, density: 58.1 }
  };
  return data[fuelType] || { temp: 20.0, density: 50.0 };
};

const showRefillModal = ref(false);
const refillData = ref({ type: 'Diesel B5 S-50', amount: '' });

const openRefillModal = () => showRefillModal.value = true;
const closeRefillModal = () => {
  showRefillModal.value = false;
  refillData.value.amount = '';
};

const freeCapacity = computed(() => {
  const s = inventoryStore.getStock(refillData.value.type);
  return s.maxCapacityGallons - s.currentGallons;
});

const willExceedCapacity = computed(() => {
  return refillData.value.amount > 0 && refillData.value.amount > freeCapacity.value;
});

const submitRefill = async () => {
  const amountToAdd = Number(refillData.value.amount);
  const res = await inventoryStore.refillFuel(refillData.value.type, amountToAdd);

  if (res.success) {
    toast.success('Inventario Actualizado', {
      description: `Se han ingresado ${amountToAdd} gal a ${refillData.value.type}`
    });
    closeRefillModal();
  } else {
    toast.error('Error de Operación', {
      description: res.message || 'No se pudo completar la recarga.'
    });
  }
};
</script>

<style scoped>
.inventory-view { animation: fadeIn 0.4s ease-out; font-family: 'Inter', sans-serif; }

/* Header & Botón */
.header-section { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
.page-title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px;}
.page-subtitle { color: #64748b; margin: 4px 0 0; font-size: 14px;}

.btn-primary {
  display: flex; align-items: center; gap: 8px;
  background: #111827; color: white;
  border: none; padding: 10px 20px; border-radius: 10px;
  font-weight: 600; font-size: 14px; cursor: pointer;
  transition: all 0.2s ease; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}
.btn-primary:hover:not(:disabled) { background: #1f2937; transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.15); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-secondary {
  background: white; color: #475569; border: 1px solid #cbd5e1;
  padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: 0.2s;
}
.btn-secondary:hover { background: #f8fafc; color: #0f172a; }

/* Grid de Tarjetas */
.tanks-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.tank-card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); display: flex; flex-direction: column;}
.tank-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
.tank-title-group h4 { margin: 0 0 6px 0; font-size: 18px; font-weight: 800; color: #0f172a; }
.sensor-status { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #10B981; font-weight: 600; }

/* Wrapper Estructural del Tanque */
.tank-wrapper { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 24px; }

/* El Tanque de Cristal */
.tank-glass {
  height: 240px; width: 110px; background: #f8fafc; border: 4px solid #e2e8f0;
  border-radius: 16px; position: relative; overflow: hidden; display: flex; align-items: flex-end;
  box-shadow: inset 0 4px 10px rgba(0,0,0,0.05);
}
.tank-liquid { width: 100%; transition: height 1s cubic-bezier(0.4, 0, 0.2, 1); position: relative; border-radius: 0 0 10px 10px; }
.liquid-surface { position: absolute; top: -6px; left: 0; width: 100%; height: 12px; background: rgba(255, 255, 255, 0.25); border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }

.tank-liquid.optimal { background: linear-gradient(180deg, #3b82f6, #1d4ed8); }
.tank-liquid.warning { background: linear-gradient(180deg, #f59e0b, #d97706); }
.tank-liquid.critical { background: linear-gradient(180deg, #ef4444, #b91c1c); }

.tank-markers { display: flex; flex-direction: column; justify-content: space-between; height: 230px; }
.marker { display: flex; align-items: center; color: #94a3b8; font-size: 12px; font-weight: 700; position: relative; }
.marker::before { content: ''; display: block; width: 8px; height: 2px; background-color: #cbd5e1; margin-right: 8px; }

/* Logística Inbound */
.inbound-alert { display: flex; align-items: center; gap: 8px; background: #eff6ff; color: #2563eb; padding: 10px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; margin-bottom: 20px; border: 1px solid #bfdbfe;}

/* Estadísticas Inferiores */
.tank-stats { display: flex; flex-direction: column; gap: 12px; border-top: 1px dashed #e2e8f0; padding-top: 20px; margin-bottom: 20px; }
.stat { display: flex; justify-content: space-between; align-items: baseline; }
.stat .label { font-size: 13px; font-weight: 600; color: #64748b; }
.stat .value { font-size: 15px; font-weight: 800; color: #0f172a; }
.text-muted { color: #94a3b8 !important; font-weight: 600 !important; }

/* Telemetría IoT */
.telemetry-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafc; padding: 12px; border-radius: 12px; margin-top: auto;}
.telemetry-item { display: flex; align-items: flex-start; gap: 8px; }
.telemetry-data { display: flex; flex-direction: column; gap: 2px; }
.telemetry-data .label { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;}
.telemetry-data .value { font-size: 13px; color: #0f172a; font-weight: 700; }

.status-tag { padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 800; letter-spacing: 0.5px;}
.status-tag.optimal { background: #ecfdf5; color: #10b981; }
.status-tag.warning { background: #fffbeb; color: #d97706; }
.status-tag.critical { background: #fef2f2; color: #ef4444; }

/* --- MODAL ESTILOS --- */
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; animation: fadeIn 0.2s;}
.modal-content { background: white; width: 100%; max-width: 450px; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); overflow: hidden; transform: translateY(0); animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);}
.modal-header { padding: 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;}
.modal-header h3 { margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; }
.btn-close { background: none; border: none; color: #64748b; cursor: pointer; padding: 4px; border-radius: 6px;}
.btn-close:hover { background: #f1f5f9; color: #0f172a; }
.modal-body { padding: 24px; }
.modal-desc { font-size: 14px; color: #64748b; margin: 0 0 24px 0; line-height: 1.5; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 8px; }
.form-input { width: 100%; padding: 12px 16px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px; color: #0f172a; box-sizing: border-box; outline: none; transition: border-color 0.2s; font-family: 'Inter', sans-serif;}
.form-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
.alert-error { display: flex; align-items: flex-start; gap: 8px; padding: 12px; background: #fef2f2; color: #ef4444; border-radius: 10px; font-size: 13px; font-weight: 600; margin-top: 10px;}
.modal-footer { padding: 20px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 12px;}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>