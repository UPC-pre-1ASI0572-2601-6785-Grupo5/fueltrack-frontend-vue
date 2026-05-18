import { defineStore } from 'pinia';
import { ref } from 'vue';
import { MockIoTService } from '../../infrastructure/MockIoTService.js';

export const useTrackingStore = defineStore('tracking', () => {
    const iotService = new MockIoTService();
    const currentTelemetry = ref(null);
    const isTracking = ref(false);

    const startLiveTracking = (truckId, orderId) => {
        isTracking.value = true;
        // Nos suscribimos al stream de datos
        iotService.subscribeToTruck(truckId, orderId, (data) => {
            currentTelemetry.value = data;
        });
    };

    const stopLiveTracking = () => {
        iotService.unsubscribe();
        isTracking.value = false;
        currentTelemetry.value = null;
    };

    return { currentTelemetry, isTracking, startLiveTracking, stopLiveTracking };
});