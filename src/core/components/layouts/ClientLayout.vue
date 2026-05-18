<template>
  <div class="app-wrapper">

    <aside :class="['sidebar-glass', { 'sidebar-open': isMobileMenuOpen }]">
      <div class="brand-section">
        <div class="logo-box">
          <DropletsIcon :size="24" class="text-white" />
        </div>
        <div class="brand-text">
          <h1>FuelTrack</h1>
          <span class="badge">Portal Cliente</span>
        </div>
        <button class="btn-close-mobile" @click="isMobileMenuOpen = false">
          <XIcon :size="20" />
        </button>
      </div>

      <nav class="nav-menu">
        <router-link to="/client/dashboard" class="nav-item" active-class="active">
          <LayoutDashboardIcon :size="20" class="nav-icon" />
          <span>Panel de Control</span>
        </router-link>

        <router-link to="/client/analytics" class="nav-item" active-class="active">
          <BarChart3Icon :size="20" class="nav-icon" />
          <span>Análisis de Datos</span>
        </router-link>

        <router-link to="/client/orders" class="nav-item" active-class="active">
          <ClipboardListIcon :size="20" class="nav-icon" />
          <span>Mis Pedidos</span>
        </router-link>
      </nav>

      <div class="user-profile-section">
        <div class="user-info">
          <div class="avatar">
            <Building2Icon :size="20" />
          </div>
          <div class="user-details">
            <span class="company-name">Minera Yanacocha S.A.</span>
            <span class="role-text">Cuenta Verificada</span>
          </div>
        </div>
        <button class="btn-logout" @click="handleLogout" title="Cerrar Sesión">
          <LogOutIcon :size="18" />
        </button>
      </div>
    </aside>

    <main class="main-panel">
      <header class="topbar">
        <div class="topbar-left">
          <button class="btn-hamburger" @click="isMobileMenuOpen = true">
            <MenuIcon :size="24" />
          </button>
          <div class="breadcrumbs">
            <span class="text-muted">FuelTrack</span>
            <ChevronRightIcon :size="14" class="separator" />
            <span class="text-muted">Portal Cliente</span>
            <ChevronRightIcon :size="14" class="separator" />
            <span class="current-route">{{ currentRouteName }}</span>
          </div>
        </div>

        <div class="topbar-actions">
          <button class="btn-icon" @click="notificationStore.togglePanel">
            <BellIcon :size="20" />
            <span v-if="notificationStore.unreadCount > 0" class="notification-dot"></span>
          </button>
          <div class="divider-vertical"></div>
          <div class="user-greeting">
            <span class="text-muted">Hola,</span>
            <strong>Administrador</strong>
          </div>
        </div>
      </header>

      <div class="page-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <NotificationPanel />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
// 🚀 FIX: Asegúrate de que las rutas a los stores sean correctas
import { useNotificationStore } from '../../../modules/order-management/application/stores/notificationStore.js';
import NotificationPanel from '../ui/NotificationPanel.vue';
import { toast } from 'vue-sonner';

import {
  DropletsIcon, ClipboardListIcon, Building2Icon, LayoutDashboardIcon,
  LogOutIcon, ChevronRightIcon, BellIcon, MenuIcon, XIcon, BarChart3Icon
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const notificationStore = useNotificationStore();
const isMobileMenuOpen = ref(false);

const currentRouteName = computed(() => {
  if (route.path.includes('dashboard')) return 'Panel de Control';
  if (route.path.includes('orders')) return 'Mis Pedidos';
  if (route.path.includes('analytics')) return 'Análisis de Datos';
  if (route.path.includes('tracking')) return 'Radar Satelital';
  return 'Centro de Operaciones';
});

onMounted(() => {
  if (notificationStore.sendWelcomeMessage) {
    // Bienvenida específica para el cliente
    notificationStore.sendWelcomeMessage('REQUESTER');
  }
});

const handleLogout = () => {
  toast.promise(
      new Promise((resolve) => setTimeout(resolve, 800)),
      {
        loading: 'Cerrando sesión segura...',
        success: () => {
          localStorage.removeItem('userRole'); // Limpia sesión
          router.push('/login');
          return 'Sesión finalizada';
        },
        error: 'Error'
      }
  );
};
</script>

<style scoped>
/* ─── FONDO GLOBAL (AZUL CORPORATIVO CLIENTE) ──────────────── */
.app-wrapper {
  height: 100vh;
  width: 100vw;
  display: flex;
  /* 🚀 FIX: Fondo azul noche para diferenciar del proveedor (verde) */
  background: radial-gradient(circle at 30% 0%, #1e3a8a 0%, #0f172a 50%, #020617 100%);
  padding: 24px;
  gap: 0;
  box-sizing: border-box;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
}

/* ─── SIDEBAR — va DEBAJO del panel ────────────────────────── */
.sidebar-glass {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-right: none;
  border-radius: 32px 0 0 32px;
  padding: 24px 0;
  overflow: visible;
  position: relative;
  z-index: 1;
}

/* ─── BRAND ────────────────────────────────────────────────── */
.brand-section {
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 30px;
}
.logo-box {
  width: 40px; height: 40px;
  border-radius: 12px;
  background: rgba(255,255,255,0.15);
  display: flex; align-items: center; justify-content: center;
}
.text-white { color: white; }
.brand-text { display: flex; flex-direction: column; }
.brand-text h1 {
  margin: 0; font-size: 20px; font-weight: 800;
  color: white; letter-spacing: -0.5px;
}
.badge {
  font-size: 10px; font-weight: 700; color: #60a5fa;
  background: rgba(96, 165, 250, 0.15);
  padding: 2px 8px; border-radius: 6px;
  text-transform: uppercase; margin-top: 4px;
}
.btn-close-mobile { display: none; background: none; border: none; color: white; cursor: pointer; }

/* ─── NAV Y TRANSICIÓN FLUIDA ──────────────────────────────── */
.nav-menu {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 16px;
  overflow: visible;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}
.nav-icon { color: rgba(255, 255, 255, 0.5); transition: color 0.4s ease; }
.nav-item:hover:not(.active) { background: rgba(255, 255, 255, 0.08); color: white; }
.nav-item:hover:not(.active) .nav-icon { color: white; }

/* El Truco Mágico de la curva que se funde con el Main Panel */
.nav-item::before,
.nav-item::after {
  content: '';
  position: absolute;
  right: 0;
  width: 20px;
  height: 20px;
  background: transparent;
  pointer-events: none;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-item::before {
  top: -20px;
  box-shadow: 8px 8px 0 8px #ffffff;
  border-bottom-right-radius: 14px;
}

.nav-item::after {
  bottom: -20px;
  box-shadow: 8px -8px 0 8px #ffffff;
  border-top-right-radius: 14px;
}

/* ─── PASTILLA ACTIVA ──────────────────────────────────────── */
.nav-item.active {
  background: #ffffff;
  color: #0f172a; /* 🚀 FIX: Azul super oscuro en vez de verde para combinar */
  font-weight: 700;
  border-radius: 20px 0 0 20px;
  margin-right: -18px;
  padding-right: 36px;
  z-index: 1;
}
.nav-item.active .nav-icon { color: #3b82f6; } /* Ícono azul brillante */

.nav-item.active::before,
.nav-item.active::after {
  opacity: 1;
}

/* ─── PERFIL ───────────────────────────────────────────────── */
.user-profile-section {
  padding: 0 20px;
  display: flex; align-items: center; gap: 12px;
  margin-top: 20px;
}
.user-info { display: flex; align-items: flex-start; gap: 12px; flex: 1; min-width: 0; }
.avatar {
  width: 42px; height: 42px; border-radius: 12px;
  background: rgba(255,255,255,0.1);
  display: flex; align-items: center; justify-content: center;
  color: white; flex-shrink: 0;
}
.user-details { display: flex; flex-direction: column; flex: 1; min-width: 0; padding-top: 4px; }
.company-name { font-size: 13px; font-weight: 700; color: white; white-space: normal; line-height: 1.3; margin-bottom: 2px; }
.role-text { font-size: 11px; color: rgba(255,255,255,0.6); font-weight: 600; }
.btn-logout {
  background: rgba(255,255,255,0.05); border: none; color: white;
  padding: 12px; border-radius: 12px; cursor: pointer; transition: 0.2s;
}
.btn-logout:hover { background: #EF4444; color: white; }

/* ─── PANEL PRINCIPAL ──────────────────────────────────────── */
.main-panel {
  flex: 1;
  background: #ffffff;
  border-radius: 0 32px 32px 32px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: -8px 0 32px rgba(0,0,0,0.25);
  position: relative;
  z-index: 2;
}

/* ─── TOPBAR ───────────────────────────────────────────────── */
.topbar {
  height: 80px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 36px;
  border-bottom: 1px solid #f1f5f9;
  background: #ffffff;
}
.topbar-left { display: flex; align-items: center; gap: 16px; }
.breadcrumbs { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; }
.text-muted { color: #64748b; }
.separator { color: #cbd5e1; }
.current-route { color: #0f172a; font-weight: 800; font-size: 15px; }
.topbar-actions { display: flex; align-items: center; gap: 16px; }
.btn-icon {
  position: relative; background: #f8fafc;
  border: 1px solid #e2e8f0; color: #64748b;
  cursor: pointer; padding: 10px; border-radius: 12px; transition: 0.2s;
}
.btn-icon:hover { color: #0f172a; background: #f1f5f9; }
.notification-dot {
  position: absolute; top: 10px; right: 10px;
  width: 8px; height: 8px; background: #EF4444;
  border-radius: 50%; border: 2px solid white;
}
.divider-vertical { width: 1px; height: 32px; background: #e2e8f0; }
.user-greeting { font-size: 14px; color: #0f172a; }
.btn-hamburger { display: none; background: none; border: none; cursor: pointer; color: #0f172a; }

/* ─── PAGE CONTENT Y TRANSICIÓN PREMIUM ────────────────────── */
.page-content { flex: 1; overflow-y: auto; padding: 36px; background: #fafbfc; }

.fade-page-enter-active,
.fade-page-leave-active {
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1),
  transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-page-enter-from { opacity: 0; transform: translateY(15px); }
.fade-page-leave-to { opacity: 0; transform: translateY(-15px); }

/* ─── MÓVIL ────────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .app-wrapper { padding: 12px; flex-direction: column; overflow: auto; gap: 12px; }
  .sidebar-glass {
    position: fixed; top: 12px; left: 12px; bottom: 12px;
    transform: translateX(-120%); z-index: 50;
    border-radius: 32px;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
  }
  .sidebar-glass.sidebar-open { transform: translateX(0); }
  .main-panel { border-radius: 24px; min-height: 100vh; z-index: 1; }
  .btn-hamburger { display: block; }
  .btn-close-mobile { display: block; }
  .nav-item.active {
    border-radius: 20px;
    margin-right: 0;
    padding-right: 18px;
  }
  .nav-item.active::before,
  .nav-item.active::after { display: none; }
}
</style>