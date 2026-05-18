import { Order } from '../../domain/entities/Order.js';

let mockDatabase = [
    new Order({ id: 'ORD-001', fuelType: 'Diesel B5', gallons: 500, status: 'DELIVERED', createdAt: new Date(Date.now() - 86400000), documentRef: 'OC-2026-0012' }),
    new Order({ id: 'ORD-002', fuelType: 'Gasohol 95', gallons: 200, status: 'PENDING_APPROVAL', createdAt: new Date(), documentRef: 'VOUCHER-BCP-992' }),
];

export class MockOrderRepository {
    async getAll() {
        await new Promise(resolve => setTimeout(resolve, 600));
        return [...mockDatabase];
    }

    async save(order) {
        await new Promise(resolve => setTimeout(resolve, 800));
        mockDatabase.unshift(order);
        return order;
    }
}