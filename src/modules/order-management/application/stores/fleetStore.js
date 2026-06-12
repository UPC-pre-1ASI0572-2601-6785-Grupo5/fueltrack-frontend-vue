import { defineStore } from 'pinia';
import { ref } from 'vue';
import { http } from '@/core/api/http.js';

export const useFleetStore = defineStore('fleet', () => {
    const vehicles = ref([]);
    const isLoading = ref(false);

    const fetchVehicles = async () => {
        isLoading.value = true;
        try {
            vehicles.value = await http.get('/api/v1/vehicles');
        } finally {
            isLoading.value = false;
        }
    };

    return { vehicles, isLoading, fetchVehicles };
});
