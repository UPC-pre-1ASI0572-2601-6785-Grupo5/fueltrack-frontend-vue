export class Order {
    constructor({ id, fuelType, gallons, status, createdAt, documentRef, truckId }) {
        this.id = id;
        this.fuelType = fuelType;
        this.gallons = gallons;
        this.status = status || 'PENDING_APPROVAL';
        this.createdAt = createdAt || new Date();
        this.documentRef = documentRef || null;
        this.truckId = truckId || null; // Nuevo: ID del camión cisterna asignado

        if (this.gallons < 10) throw new Error('El pedido mínimo es de 10 galones.');
        if (!this.documentRef || this.documentRef.trim() === '') throw new Error('Es obligatorio adjuntar un N° de Orden de Compra o Voucher.');
    }

    // Nueva regla de negocio: Comportamiento de despacho
    dispatch(truckId) {
        if (this.status !== 'APPROVED') {
            throw new Error('Solo se pueden despachar pedidos que ya han sido aprobados.');
        }
        if (!truckId) {
            throw new Error('Debe asignar una placa de camión cisterna válida.');
        }

        this.truckId = truckId;
        this.status = 'IN_TRANSIT';
    }
}