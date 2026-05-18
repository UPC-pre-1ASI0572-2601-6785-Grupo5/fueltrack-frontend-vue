export class Telemetry {
    constructor(truckId, orderId, lat, lng, speed) {
        this.truckId = truckId;
        this.orderId = orderId;
        this.lat = lat;
        this.lng = lng;
        this.speed = speed; // km/h
        this.timestamp = new Date();
    }

    // Lógica de negocio: Alerta si el camión va muy rápido (cargado de combustible es peligroso)
    get isSpeeding() {
        return this.speed > 80;
    }
}