import { Telemetry } from '../domain/Telemetry.js';

export class MockIoTService {
    constructor() {
        this.interval = null;
    }

    subscribeToTruck(truckId, orderId, onDataReceived) {
        // Coordenadas de inicio simuladas (Ej. Refinería Conchán / Panamericana Sur)
        let currentLat = -12.2687;
        let currentLng = -76.9368;

        // Simulamos la recepción de un pulso GPS cada 2.5 segundos
        this.interval = setInterval(() => {
            // Movemos el camión hacia el norte (hacia la ciudad)
            currentLat += 0.0015;
            currentLng -= 0.0008;

            // Velocidad aleatoria entre 40 y 85 km/h
            const speed = Math.floor(Math.random() * 45) + 40;

            const data = new Telemetry(truckId, orderId, currentLat, currentLng, speed);
            onDataReceived(data);
        }, 2500);
    }

    unsubscribe() {
        if (this.interval) clearInterval(this.interval);
    }
}