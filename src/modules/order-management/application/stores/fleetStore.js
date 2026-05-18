// src/modules/order-management/application/stores/fleetStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useFleetStore = defineStore('fleet', () => {
    const drivers = ref([
        { id: 1, name: 'Carlos Mendoza', age: 42, phone: '+51 987 654 321', photo: 'https://i.pravatar.cc/150?u=carlos', status: 'En Ruta', license: 'A-IIIc' },
        { id: 2, name: 'Luis Perez', age: 35, phone: '+51 912 345 678', photo: 'https://i.pravatar.cc/150?u=luis', status: 'Descargando', license: 'A-IIIb' },
        { id: 3, name: 'Juan Torres', age: 29, phone: '+51 955 444 333', photo: 'https://i.pravatar.cc/150?u=juan', status: 'Disponible', license: 'A-IIb' }
    ]);

    const trucks = ref([
        { id: 'VOLVO-01', brand: 'Volvo', model: 'FMX 460', capacity: 9000, sensorId: 'SENS-01', assignedDriverId: 1 },
        { id: 'SCANIA-04', brand: 'Scania', model: 'R500', capacity: 8500, sensorId: 'SENS-04', assignedDriverId: 2 }
    ]);

    const getDriverById = (id) => drivers.value.find(d => d.id === id);

    return { drivers, trucks, getDriverById };
});