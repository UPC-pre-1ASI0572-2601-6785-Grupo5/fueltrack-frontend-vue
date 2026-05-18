import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useNotificationStore = defineStore('notifications', () => {
    const notifications = ref([]);
    const isPanelOpen = ref(false);

    // Cuenta cuántas no se han leído
    const unreadCount = computed(() => notifications.value.filter(n => !n.read).length);

    const togglePanel = () => {
        isPanelOpen.value = !isPanelOpen.value;
    };

    // Función maestra para inyectar notificaciones desde cualquier parte del sistema
    const addNotification = (title, message, type = 'info') => {
        notifications.value.unshift({
            id: Date.now() + Math.random(),
            title,
            message,
            type, // 'info', 'success', 'warning'
            read: false,
            time: new Date()
        });
    };

    const markAllAsRead = () => {
        notifications.value.forEach(n => n.read = true);
    };

    // Solo dejamos un mensaje inicial de bienvenida
    const sendWelcomeMessage = (role) => {
        if (notifications.value.length === 0) {
            addNotification(
                'Sistema Inicializado',
                `Conexión segura establecida. Sesión iniciada como ${role === 'PROVIDER' ? 'Socio Logístico' : 'Cliente'}.`,
                'info'
            );
        }
    };

    return {
        notifications, isPanelOpen, unreadCount,
        togglePanel, addNotification, markAllAsRead, sendWelcomeMessage
    };
});