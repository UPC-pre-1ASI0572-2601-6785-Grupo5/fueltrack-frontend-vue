<template>
  <div class="analytics-dashboard">

    <div class="header-section">
      <div class="title-group">
        <h2 class="page-title">Inteligencia Operativa</h2>
        <div class="hardware-badge liquid-pill">
          <span class="pulse-dot"></span> Sincronizado con ERP
        </div>
      </div>
      <div class="header-actions">
        <button class="liquid-btn btn-secondary" @click="exportData('PDF')" :disabled="isExporting">
          <Loader2Icon v-if="isExporting" class="spinner" :size="14" />
          <FileTextIcon v-else :size="14" /> Reporte Ejecutivo
        </button>
        <button class="liquid-btn btn-primary" @click="exportData('CSV')" :disabled="isExporting">
          <DownloadIcon :size="14" /> Exportar Data
        </button>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card glass-card">
        <div class="kpi-icon bg-blue-light"><TrendingUpIcon :size="18" class="text-blue" /></div>
        <div class="kpi-data">
          <span class="kpi-label">Gasto Acumulado</span>
          <h3 class="kpi-value">S/ {{ (analyticsStore.totalSpend / 1000).toFixed(1) }}k</h3>
        </div>
      </div>
      <div class="kpi-card glass-card">
        <div class="kpi-icon bg-green-light"><DropletIcon :size="18" class="text-green" /></div>
        <div class="kpi-data">
          <span class="kpi-label">Volumen Recibido</span>
          <h3 class="kpi-value">{{ (totalGallons / 1000).toFixed(1) }}k <small class="text-muted text-xs">gal</small></h3>
        </div>
      </div>
      <div class="kpi-card glass-card">
        <div class="kpi-icon bg-orange-light"><ShieldAlertIcon :size="18" class="text-orange" /></div>
        <div class="kpi-data">
          <span class="kpi-label">Riesgo de Quiebre</span>
          <h3 class="kpi-value text-orange">Bajo</h3>
        </div>
      </div>
      <div class="kpi-card glass-card">
        <div class="kpi-icon bg-gray-light"><ClockIcon :size="18" class="text-gray" /></div>
        <div class="kpi-data">
          <span class="kpi-label">Lead Time (SLA)</span>
          <h3 class="kpi-value">14.2 <small class="text-muted text-xs">hrs</small></h3>
        </div>
      </div>
    </div>

    <div class="main-content-grid">

      <div class="chart-card glass-card finance-panel">

        <div class="finance-top-bar">
          <div class="finance-title-area">
            <h4>Proyección de Consumo (Burn Rate)</h4>
            <span class="sensor-id">Evolución del gasto vs. Línea de Crédito</span>
          </div>
          <div class="finance-horizontal-metrics">
            <div class="metric-pill">
              <DollarSignIcon :size="14" class="text-blue" />
              <div class="m-data">
                <span class="m-lbl">Presupuesto M.</span>
                <span class="m-val">S/ 500k</span>
              </div>
            </div>
            <div class="metric-pill">
              <TrendingUpIcon :size="14" class="text-green" />
              <div class="m-data">
                <span class="m-lbl">Consumo Hoy</span>
                <span class="m-val">62%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="finance-chart-wrapper">
          <v-chart class="echart-canvas" :option="burnRateOption" autoresize />
        </div>

        <div class="financial-vital-stats">
          <div class="vital-item">
            <CreditCardIcon :size="16" class="v-icon text-blue" />
            <div class="v-info">
              <span class="v-lbl">Crédito Libre</span>
              <span class="v-val">S/ {{ analyticsStore.availableCredit.toLocaleString() }}</span>
            </div>
          </div>
          <div class="vital-divider"></div>
          <div class="vital-item">
            <FuelIcon :size="16" class="v-icon" />
            <div class="v-info">
              <span class="v-lbl">Precio Base Diario</span>
              <span class="v-val">S/ 16.45 / gal</span>
            </div>
          </div>
          <div class="vital-divider"></div>
          <div class="vital-item">
            <ActivityIcon :size="16" class="v-icon text-green" />
            <div class="v-info">
              <span class="v-lbl">Estado Cuenta</span>
              <span class="v-val text-green">Al Día</span>
            </div>
          </div>
        </div>

      </div>

      <div class="side-column">

        <div class="chart-card glass-card flex-half">
          <div class="chart-header">
            <h4>Consumo por OTs / Sedes</h4>
          </div>
          <div class="elastic-container">
            <v-chart class="echart-canvas" :option="sedeOption" autoresize />
          </div>
        </div>

        <div class="chart-card glass-card flex-half">
          <div class="chart-header">
            <h4>Mix de Carburantes</h4>
          </div>
          <div class="elastic-container donut-box">
            <v-chart class="echart-canvas" :option="mixOption" autoresize />
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useOrderStore } from '@/modules/order-management/application/stores/orderStore';
import { useAnalyticsStore } from '@/modules/billing-analytics/application/stores/analyticsStore';
import { toast } from 'vue-sonner';
import {
  DownloadIcon, TrendingUpIcon, ClockIcon, ShieldAlertIcon,
  FileTextIcon, DropletIcon, DollarSignIcon, FuelIcon, ActivityIcon,
  CreditCardIcon, Loader2Icon
} from 'lucide-vue-next';

// ─── IMPORTACIONES DE APACHE ECHARTS ───
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart, PieChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent, MarkLineComponent } from 'echarts/components';
import VChart from 'vue-echarts';

use([
  CanvasRenderer, LineChart, BarChart, PieChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent, MarkLineComponent
]);
// ────────────────────────────────────────

const orderStore = useOrderStore();
const analyticsStore = useAnalyticsStore();
const isExporting = ref(false);

onMounted(() => {
  orderStore.fetchOrders();
});

const totalGallons = computed(() => analyticsStore.totalGallons);

// ==========================================
// 🚀 CONFIGURACIÓN CORREGIDA DE ECHARTS
// ==========================================

const burnRateOption = ref({
  // 🚀 INYECCIÓN GLOBAL DE TIPOGRAFÍA PARA ESTE GRÁFICO
  textStyle: {
    fontFamily: "'SF Pro Text', 'Inter', system-ui, sans-serif",
    fontSize: 12,
    color: '#64748b'
  },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#e2e8f0',
    textStyle: { color: '#0f172a', fontWeight: 500 } // Tipografía del Tooltip
  },
  grid: { left: '2%', right: '4%', bottom: '2%', top: '10%', containLabel: true },
  xAxis: {
    type: 'category', boundaryGap: false,
    data: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Hoy'],
    axisLine: { show: false }, axisTick: { show: false },
    axisLabel: {
      color: '#64748b',
      fontWeight: 500, // 🚀 Letra un poco más fina y elegante
      margin: 15
    }
  },
  yAxis: {
    type: 'value', max: 510000,
    splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
    axisLabel: {
      formatter: (v) => (v/1000) + 'k',
      color: '#94a3b8',
      fontWeight: 600
    }
  },
  series: [{
    name: 'Gasto (S/)', type: 'line', smooth: true, symbol: 'none',
    lineStyle: { width: 4, color: '#2563eb', shadowColor: 'rgba(37, 99, 235, 0.4)', shadowBlur: 15, shadowOffsetY: 8 },
    areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(37, 99, 235, 0.3)' }, { offset: 1, color: 'rgba(37, 99, 235, 0.0)' }] } },
    itemStyle: { color: '#2563eb' },
    data: [50000, 120000, 190000, 280000, 350000, 410000, 487050],
    markLine: {
      symbol: 'none',
      lineStyle: { color: '#ef4444', type: 'dashed', width: 2 },
      label: {
        formatter: 'Límite S/ 500k',
        position: 'insideStartTop',
        color: '#ffffff',
        backgroundColor: '#ef4444', // 🚀 Etiqueta roja con texto blanco puro
        padding: [4, 8],
        borderRadius: 4,
        fontWeight: 700
      },
      data: [{ yAxis: 500000 }]
    }
  }]
});

// 2. SEDES (Alineación perfecta y barras fijas)
const sedeOption = ref({
  // 🚀 INYECCIÓN GLOBAL
  textStyle: {
    fontFamily: "'SF Pro Text', 'Inter', system-ui, sans-serif",
  },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: '2%', right: '15%', bottom: '0%', top: '5%', containLabel: true },
  xAxis: { type: 'value', show: false },
  yAxis: {
    type: 'category',
    data: ['Auxiliar', 'Amazonas', 'Planta L.', 'Yanacocha'],
    axisLine: { show: false }, axisTick: { show: false },
    axisLabel: {
      color: '#475569',
      fontWeight: 600, // 🚀 Letra más limpia en el eje Y
      margin: 16
    }
  },
  series: [{
    name: 'Volumen', type: 'bar', barWidth: '18px',
    itemStyle: { borderRadius: [0, 8, 8, 0], color: (params) => ['#cbd5e1', '#8b5cf6', '#6366f1', '#3b82f6'][params.dataIndex] },
    label: {
      show: true,
      position: 'right',
      formatter: (p) => (p.value/1000).toFixed(1) + 'k gal',
      color: '#0f172a',
      fontWeight: 700, // 🚀 Negrita pero sin ser tosca
      fontSize: 11
    },
    data: [3100, 5200, 8400, 12500]
  }]
});

const mixOption = computed(() => ({
  textStyle: {
    fontFamily: "'SF Pro Text', 'Inter', system-ui, sans-serif",
  },
  tooltip: { trigger: 'item', backgroundColor: 'rgba(255, 255, 255, 0.95)', borderColor: '#e2e8f0', textStyle: { color: '#0f172a' } },
  legend: {
    bottom: '0%',
    icon: 'circle',
    itemGap: 20,
    textStyle: {
      color: '#475569',
      fontWeight: 500,
      fontSize: 12
    }
  },
  series: [{
    name: 'Mix de Carburantes', type: 'pie', center: ['50%', '42%'], radius: ['55%', '80%'], avoidLabelOverlap: false,
    itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 3 },
    label: { show: false },
    emphasis: {
      label: {
        show: true,
        fontSize: 22,
        fontWeight: 800,
        color: '#0f172a',
        formatter: '{c}\n{b}'
      }
    },
    color: ['#2563eb', '#10b981', '#f59e0b'],
    data: [
      { value: analyticsStore.consumptionByFuelType[0], name: 'Diesel B5 S-50' },
      { value: analyticsStore.consumptionByFuelType[1], name: 'Gasohol 95 Plus' },
      { value: analyticsStore.consumptionByFuelType[2], name: 'Gasohol 98' }
    ]
  }]
}));

const exportData = async (format) => {
  isExporting.value = true;
  await new Promise(resolve => setTimeout(resolve, 1500));
  toast.success(`Reporte ${format} Generado`, { description: `Tu archivo ha sido descargado exitosamente.` });
  isExporting.value = false;
};
</script>

<style scoped>
/* ─── BASE ZERO SCROLL ─── */
.analytics-dashboard {
  display: flex; flex-direction: column; height: 100vh; max-height: 100%;
  animation: fadeIn 0.4s ease-out; font-family: 'Inter', sans-serif; overflow: hidden;
}

.glass-card {
  background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 1); border-radius: 24px;
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  padding: 20px; display: flex; flex-direction: column; transition: all 0.3s ease;
}

/* Utils y Botones */
.liquid-pill { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 6px 12px; font-size: 12px; font-weight: 600; color: #0f172a; box-shadow: 0 2px 6px rgba(0,0,0,0.02); display: flex; align-items: center; gap: 8px; cursor: default; }
.liquid-btn { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 20px; font-size: 13px; font-weight: 700; color: #0f172a; box-shadow: 0 2px 6px rgba(0,0,0,0.02); cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; justify-content: center; min-width: 160px; }
.btn-primary { background: #0f172a; color: white; border-color: #0f172a;}
.btn-primary:hover:not(:disabled) { background: #1e293b; transform: translateY(-2px);}
.btn-secondary:hover:not(:disabled) { border-color: #3b82f6; color: #3b82f6; transform: translateY(-2px);}
.liquid-btn:disabled { opacity: 0.7; cursor: not-allowed; }

/* ─── HEADER ─── */
.header-section { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; flex-shrink: 0;}
.title-group { display: flex; align-items: center; gap: 16px;}
.page-title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px;}
.hardware-badge { color: #475569; font-size: 11px; }
.pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; animation: pulse 2s infinite; }
.header-actions { display: flex; align-items: center; gap: 12px; }

/* ─── KPIs SUPERIORES ─── */
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; flex-shrink: 0;}
.kpi-card { flex-direction: row; align-items: center; gap: 16px; padding: 16px 20px; }
.kpi-icon { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;}

.bg-green-light { background: #dcfce7; } .text-green { color: #10b981; }
.bg-blue-light { background: #dbeafe; } .text-blue { color: #3b82f6; }
.bg-orange-light { background: #fef3c7; } .text-orange { color: #f59e0b; }
.bg-gray-light { background: #f1f5f9; } .text-gray { color: #64748b; }

.kpi-data { display: flex; flex-direction: column;}
.kpi-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;}
.kpi-value { font-size: 22px; font-weight: 800; margin: 2px 0 0 0; color: #0f172a; }
.text-xs { font-size: 12px; }

/* ─── MAIN GRID ─── */
.main-content-grid { display: grid; grid-template-columns: 2.3fr 1fr; gap: 20px; flex: 1; min-height: 0;}

/* ─── PANEL FINANCIERO (IZQUIERDA) ─── */
.finance-panel { flex: 1; justify-content: space-between; position: relative;}
.finance-top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-shrink: 0;}
.finance-title-area h4 { font-size: 16px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0;}
.sensor-id { font-size: 11px; color: #64748b; font-weight: 600; }

.finance-horizontal-metrics { display: flex; gap: 12px; }
.metric-pill { display: flex; align-items: center; gap: 10px; background: #f8fafc; padding: 8px 16px; border-radius: 12px; border: 1px solid #f1f5f9;}
.m-data { display: flex; flex-direction: column; }
.m-lbl { font-size: 10px; font-weight: 600; color: #64748b; }
.m-val { font-size: 14px; font-weight: 800; color: #0f172a;}

.finance-chart-wrapper { flex: 1; min-height: 0; width: 100%; position: relative; margin: 10px 0;}

/* 🚀 FIX: FOOTER SIGNOS VITALES (CSS Grid para alineación perfecta) */
.financial-vital-stats {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr; /* 3 bloques y 2 divisores */
  align-items: center;
  background: #f8fafc;
  padding: 16px 24px;
  border-radius: 16px;
  border: 1px solid #f1f5f9;
  flex-shrink: 0;
}
.vital-item { display: flex; align-items: center; gap: 14px; justify-content: center; }
.v-icon { color: #64748b; }
.v-info { display: flex; flex-direction: column; }
.v-lbl { font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; }
.v-val { font-size: 14px; font-weight: 800; color: #0f172a; }
.vital-divider { width: 1px; height: 30px; background: #e2e8f0; margin: 0 auto;}

/* ─── COLUMNA DERECHA ─── */
.side-column { display: flex; flex-direction: column; gap: 20px; min-height: 0; }
.flex-half { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-shrink: 0; }
.chart-header h4 { margin: 0; font-size: 14px; font-weight: 800; color: #0f172a; }

/* Contenedor de ECharts Universal */
.elastic-container { flex: 1; min-height: 0; width: 100%; position: relative; display: flex; flex-direction: column; justify-content: center;}
.echart-canvas { width: 100%; height: 100%; }

/* Animaciones */
.spinner { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.2); } 100% { opacity: 1; transform: scale(1); } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 1024px) {
  .analytics-dashboard { height: auto; overflow: visible; }
  .main-content-grid { grid-template-columns: 1fr; }
  .kpi-grid { grid-template-columns: 1fr 1fr; }
  .finance-chart-wrapper { min-height: 300px; }
  .financial-vital-stats { grid-template-columns: 1fr; gap: 10px; padding: 20px;}
  .vital-divider { display: none; }
  .vital-item { justify-content: flex-start; }
}

@media (max-width: 768px) {
  .header-section { flex-direction: column; align-items: flex-start; gap: 16px; }
  .header-actions { width: 100%; flex-direction: column; gap: 8px; }
  .liquid-btn { width: 100%; justify-content: center; }
  .kpi-grid { grid-template-columns: 1fr; }
  .finance-top-bar { flex-direction: column; align-items: flex-start; gap: 16px; }
  .finance-horizontal-metrics { width: 100%; flex-direction: column; }
  .metric-pill { width: 100%; justify-content: flex-start; }
  .elastic-container { min-height: 250px; }
}
</style>