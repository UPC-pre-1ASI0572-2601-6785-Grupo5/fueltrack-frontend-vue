import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useOrderStore } from '../../../order-management/application/stores/orderStore';

export const useAnalyticsStore = defineStore('analytics', () => {
    const orderStore = useOrderStore();

    // Métrica 1: Total de galones consumidos (Solo de pedidos entregados o en ruta)
    const totalGallons = computed(() => {
        return orderStore.orders
            .filter(o => ['IN_TRANSIT', 'DELIVERED'].includes(o.status))
            .reduce((acc, o) => acc + o.gallons, 0);
    });

    // Métrica 2: Gasto estimado (Simulando S/ 18.50 por galón)
    const totalSpend = computed(() => totalGallons.value * 18.50);

    // Métrica 3: Datos para el gráfico de barras (Consumo por tipo de combustible)
    const consumptionByFuelType = computed(() => {
        const types = ['Diesel B5 S-50', 'Gasohol 95 Plus', 'Gasohol 98'];
        return types.map(type =>
            orderStore.orders
                .filter(o => o.fuelType === type)
                .reduce((acc, o) => acc + o.gallons, 0)
        );
    });

    return { totalGallons, totalSpend, consumptionByFuelType };
});