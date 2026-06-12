import { defineStore } from 'pinia';
import { ref } from 'vue';
import { http } from '@/core/api/http.js';

export const useInventoryStore = defineStore('inventory', () => {
    const stocks = ref([]);
    const isLoading = ref(false);

    const fetchStocks = async () => {
        isLoading.value = true;
        try {
            stocks.value = await http.get('/api/v1/inventory/stocks');
        } finally {
            isLoading.value = false;
        }
    };

    const getStock = (fuelType) =>
        stocks.value.find(s => s.fuelType === fuelType) || { currentGallons: 0, maxCapacityGallons: 50000 };

    const getPercentage = (fuelType) => {
        const s = getStock(fuelType);
        return s.maxCapacityGallons > 0 ? (s.currentGallons / s.maxCapacityGallons) * 100 : 0;
    };

    const refillFuel = async (fuelType, gallons) => {
        try {
            const updated = await http.post('/api/v1/inventory/refill', { fuelType, gallons });
            const idx = stocks.value.findIndex(s => s.fuelType === fuelType);
            if (idx !== -1) stocks.value[idx] = updated;
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const dischargeFuel = async (fuelType, gallons) => {
        try {
            const updated = await http.post('/api/v1/inventory/discharge', { fuelType, gallons });
            const idx = stocks.value.findIndex(s => s.fuelType === fuelType);
            if (idx !== -1) stocks.value[idx] = updated;
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    return { stocks, isLoading, fetchStocks, getStock, getPercentage, refillFuel, dischargeFuel };
});
