<template>
  <Teleport to="body">
    <div class="notification-wrapper">
      <transition name="fade">
        <div v-if="notificationStore.isPanelOpen" class="overlay" @click="notificationStore.togglePanel"></div>
      </transition>

      <transition name="slide-right">
        <aside v-if="notificationStore.isPanelOpen" class="notification-panel">

          <div class="panel-header">
            <div>
              <h3>Centro de Notificaciones</h3>
              <p v-if="notificationStore.unreadCount > 0" class="text-primary">
                Tienes {{ notificationStore.unreadCount }} alertas nuevas
              </p>
              <p v-else class="text-muted">Estás al día</p>
            </div>
            <button class="btn-close" @click="notificationStore.togglePanel">
              <XIcon :size="20" />
            </button>
          </div>

          <div class="panel-actions" v-if="notificationStore.notifications.length > 0">
            <button class="btn-text" @click="notificationStore.markAllAsRead">
              <CheckCheckIcon :size="16" /> Marcar todas como leídas
            </button>
          </div>

          <div class="panel-body">
            <div v-if="notificationStore.notifications.length === 0" class="empty-state">
              <BellOffIcon :size="40" class="empty-icon" />
              <p>No hay notificaciones</p>
            </div>

            <div
                v-else
                v-for="notif in notificationStore.notifications"
                :key="notif.id"
                class="notif-card"
                :class="{ 'unread': !notif.read }"
            >
              <div class="notif-icon" :class="notif.type">
                <AlertCircleIcon v-if="notif.type === 'warning'" :size="18" />
                <CheckCircleIcon v-else-if="notif.type === 'success'" :size="18" />
                <InfoIcon v-else :size="18" />
              </div>
              <div class="notif-content">
                <h4>{{ notif.title }}</h4>
                <p>{{ notif.message }}</p>
                <span class="time">{{ new Date(notif.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</span>
              </div>
              <div v-if="!notif.read" class="unread-dot"></div>
            </div>
          </div>

        </aside>
      </transition>
    </div>
  </Teleport>
</template>

<script setup>
import { useNotificationStore } from '../../../modules/order-management/application/stores/notificationStore.js';
import {
  XIcon, CheckCheckIcon, BellOffIcon,
  AlertCircleIcon, CheckCircleIcon, InfoIcon
} from 'lucide-vue-next';

const notificationStore = useNotificationStore();
</script>

<style scoped>
/* Z-Index ultra alto garantizado */
.notification-wrapper { position: relative; z-index: 99999; }

.overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(2px); z-index: 99998; }

.notification-panel {
  position: fixed; top: 0; right: 0; height: 100vh; width: 380px;
  background: #ffffff; box-shadow: -4px 0 24px rgba(0,0,0,0.1);
  z-index: 99999; display: flex; flex-direction: column; font-family: 'Inter', sans-serif;
}

.panel-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 24px; border-bottom: 1px solid #E2E8F0; }
.panel-header h3 { margin: 0; font-size: 18px; font-weight: 800; color: #0F172A; }
.panel-header p { margin: 4px 0 0 0; font-size: 13px; font-weight: 600; }
.text-primary { color: #2563EB; }
.text-muted { color: #64748B; }

.btn-close { background: transparent; border: none; color: #64748B; cursor: pointer; padding: 4px; border-radius: 6px; transition: 0.2s; }
.btn-close:hover { background: #F1F5F9; color: #0F172A; }

.panel-actions { padding: 12px 24px; border-bottom: 1px solid #F1F5F9; display: flex; justify-content: flex-end; }
.btn-text { background: transparent; border: none; color: #2563EB; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; }
.btn-text:hover { color: #1D4ED8; text-decoration: underline; }

.panel-body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px; background: #F8FAFC; }

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #94A3B8; }
.empty-icon { margin-bottom: 12px; opacity: 0.5; }

.notif-card { background: #ffffff; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; display: flex; gap: 12px; position: relative; transition: all 0.2s; }
.notif-card.unread { background: #EFF6FF; border-color: #BFDBFE; }

.notif-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.notif-icon.info { background: #F1F5F9; color: #64748B; }
.notif-icon.success { background: #DCFCE7; color: #10B981; }
.notif-icon.warning { background: #FEF3C7; color: #D97706; }

.notif-content h4 { margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #0F172A; }
.notif-content p { margin: 0 0 8px 0; font-size: 13px; color: #475569; line-height: 1.4; }
.notif-content .time { font-size: 11px; color: #94A3B8; font-weight: 600; }

.unread-dot { position: absolute; top: 16px; right: 16px; width: 8px; height: 8px; background: #2563EB; border-radius: 50%; }

/* Animaciones */
.slide-right-enter-active, .slide-right-leave-active { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>