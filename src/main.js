import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
// 👇 Importación explícita apuntando al archivo index.js
import router from './core/router/index.js'
import VueApexCharts from "vue3-apexcharts";

// 🚀 EL PARCHE MÁGICO: Importamos los estilos de la notificación
import 'vue-sonner/style.css';

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VueApexCharts)

app.mount('#app')