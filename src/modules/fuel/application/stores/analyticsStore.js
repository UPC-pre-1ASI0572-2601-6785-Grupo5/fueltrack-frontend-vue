import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useOrderStore } from '../../../order-management/application/stores/orderStore';

export const useAnalyticsStore = defineStore('analyticsStore', () => {
    const orderStore = useOrderStore();

    const totalGallons = computed(() =>
        orderStore.orders
            .filter(o => ['IN_TRANSIT', 'DELIVERED'].includes(o.status))
            .reduce((acc, o) => acc + o.gallons, 0)
    );

    const totalSpend = computed(() => totalGallons.value * 18.50);

    const budgetLimit = 500000;

    const consumptionByFuelType = computed(() => {
        const types = ['Diesel B5 S-50', 'Gasohol 95 Plus', 'Diésel Marino'];
        return types.map(type =>
            orderStore.orders
                .filter(o => o.fuelType === type)
                .reduce((acc, o) => acc + o.gallons, 0)
        );
    });

    const creditUsedPercentage = computed(() =>
        Math.min((totalSpend.value / budgetLimit) * 100, 100)
    );

    const availableCredit = computed(() => budgetLimit - totalSpend.value);

    return { totalGallons, totalSpend, budgetLimit, consumptionByFuelType, creditUsedPercentage, availableCredit };
});
