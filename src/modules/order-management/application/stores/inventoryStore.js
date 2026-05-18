import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useInventoryStore = defineStore('inventory', () => {
    const MAX_CAPACITY = 50000;

    const stocks = ref({
        'Diesel B5': 42000,
        'Gasohol 95': 28000,
        'Gasohol 98': 12000
    });

    const getPercentage = (type) => (stocks.value[type] / MAX_CAPACITY) * 100;

    const dischargeFuel = (type, amount) => {
        if (stocks.value[type] >= amount) {
            stocks.value[type] -= amount;
            return { success: true };
        }
        return { success: false, message: 'Stock insuficiente en tanque' };
    };

// Acción para RECARGAR combustible desde refinería
    const refillFuel = (type, amount) => {
        if (stocks.value[type] + amount <= MAX_CAPACITY) {
            stocks.value[type] += amount;
            return { success: true };
        }
        return { success: false, message: 'La recarga excede la capacidad máxima del tanque' };
    };

    // No olvides exportarla al final:
    return { stocks, MAX_CAPACITY, getPercentage, dischargeFuel, refillFuel };
});