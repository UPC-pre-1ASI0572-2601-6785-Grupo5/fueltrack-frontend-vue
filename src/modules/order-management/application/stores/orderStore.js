import { defineStore } from 'pinia';
import { ref } from 'vue';
import { http } from '@/core/api/http.js';
import { useNotificationStore } from './notificationStore.js';

export const useOrderStore = defineStore('orders', () => {
    const orders = ref([]);
    const isLoading = ref(false);
    const isSaving = ref(false);

    const fetchOrders = async () => {
        isLoading.value = true;
        try {
            orders.value = await http.get('/api/v1/orders');
        } finally {
            isLoading.value = false;
        }
    };

    const createNewOrder = async (orderData) => {
        isSaving.value = true;
        const notifStore = useNotificationStore();
        try {
            const response = await http.post('/api/v1/orders', {
                fuelType: orderData.fuelType,
                gallons: Number(orderData.gallons),
                documentRef: orderData.documentRef,
            });
            orders.value.unshift(response);
            notifStore.addNotification(
                'Orden Emitida con Éxito',
                `El pedido #${response.id} por ${response.gallons} galones de ${response.fuelType} ha sido registrado.`,
                'success'
            );
            return { success: true };
        } catch (error) {
            notifStore.addNotification('Error de Sistema', 'No se pudo emitir la orden.', 'warning');
            return { success: false, message: error.message };
        } finally {
            isSaving.value = false;
        }
    };

    const approveOrder = async (orderId) => {
        isSaving.value = true;
        const notifStore = useNotificationStore();
        try {
            const updated = await http.patch(`/api/v1/orders/${orderId}/approve`);
            const idx = orders.value.findIndex(o => o.id === orderId);
            if (idx !== -1) orders.value[idx] = updated;
            notifStore.addNotification('Pedido Aprobado', `La orden ${orderId} ha sido validada. Lista para asignación de flota.`, 'success');
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message || 'Error al aprobar el pedido' };
        } finally {
            isSaving.value = false;
        }
    };

    const dispatchOrder = async (orderId, truckId) => {
        isSaving.value = true;
        const notifStore = useNotificationStore();
        try {
            const updated = await http.patch(`/api/v1/orders/${orderId}/dispatch`, { truckId });
            const idx = orders.value.findIndex(o => o.id === orderId);
            if (idx !== -1) orders.value[idx] = updated;
            notifStore.addNotification('Unidad en Ruta', `La orden ${orderId} está en camino asignada al vehículo ${truckId}.`, 'info');
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        } finally {
            isSaving.value = false;
        }
    };

    return { orders, isLoading, isSaving, fetchOrders, createNewOrder, approveOrder, dispatchOrder };
});
