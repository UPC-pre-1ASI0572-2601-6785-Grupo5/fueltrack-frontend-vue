import { defineStore } from 'pinia';
import { ref } from 'vue';
import { MockOrderRepository } from '../../infrastructure/api/MockOrderRepository.js';
import { Order } from '../../domain/entities/Order.js';
import { http } from '@/core/api/http.js';

import { useNotificationStore } from './notificationStore.js';
import { useInventoryStore } from './inventoryStore';
const repository = new MockOrderRepository();

export const useOrderStore = defineStore('orders', () => {
    const orders = ref([]);
    const isLoading = ref(false);
    const isSaving = ref(false);

    const fetchOrders = async () => {
        isLoading.value = true;
        try {
            orders.value = await repository.getAll();
        } finally {
            isLoading.value = false;
        }
    };

    // 1. CUANDO SE CREA UN PEDIDO
    const createNewOrder = async (orderData) => {
        isSaving.value = true;
        const notifStore = useNotificationStore();

        try {
            const order = new Order({
                id: null,
                fuelType: orderData.fuelType,
                gallons: orderData.gallons,
                documentRef: orderData.documentRef
            });

            const response = await http.post('/api/v1/orders', {
                fuelType: order.fuelType,
                gallons: Number(order.gallons),
                documentRef: order.documentRef,
            });

            order.id = response.id;
            orders.value.unshift(order);

            notifStore.addNotification(
                'Orden Emitida con Éxito',
                `El pedido #${order.id} por ${order.gallons} galones de ${order.fuelType} ha sido registrado en el sistema.`,
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

    // 2. CUANDO EL PROVEEDOR APRUEBA
    const approveOrder = async (orderId) => {
        isSaving.value = true;
        const notifStore = useNotificationStore();

        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            const orderIndex = orders.value.findIndex(o => o.id === orderId);

            if (orderIndex !== -1) {
                orders.value[orderIndex].status = 'APPROVED';

                // 🚀 DISPARAMOS LA NOTIFICACIÓN REAL
                notifStore.addNotification(
                    'Pedido Aprobado',
                    `La orden ${orderId} ha sido validada. Lista para asignación de flota.`,
                    'success'
                );
            }
            return { success: true };
        } catch (error) {
            return { success: false, message: 'Error al aprobar el pedido' };
        } finally {
            isSaving.value = false;
        }
        const inventory = useInventoryStore();
        const resDischarge = inventory.dischargeFuel(order.fuelType, order.gallons);

        if (!resDischarge.success) {
            notifStore.addNotification('Alerta de Stock', resDischarge.message, 'warning');
            return { success: false };
        }
    };

    // 3. CUANDO EL PROVEEDOR DESPACHA
    const dispatchOrder = async (orderId, truckId) => {
        isSaving.value = true;
        const notifStore = useNotificationStore();

        try {
            await new Promise(resolve => setTimeout(resolve, 600));
            const orderIndex = orders.value.findIndex(o => o.id === orderId);

            if (orderIndex !== -1) {
                orders.value[orderIndex].dispatch(truckId);

                // 🚀 DISPARAMOS LA NOTIFICACIÓN REAL
                notifStore.addNotification(
                    'Unidad en Ruta',
                    `La orden ${orderId} está en camino asignada al vehículo ${truckId}.`,
                    'info'
                );
            }
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        } finally {
            isSaving.value = false;
        }
    };

    return { orders, isLoading, isSaving, fetchOrders, createNewOrder, approveOrder, dispatchOrder };
});