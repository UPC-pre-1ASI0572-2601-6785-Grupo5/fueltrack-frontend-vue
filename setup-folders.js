import fs from 'fs';
import path from 'path';

const dirs = [
    'src/core/api',
    'src/core/components/layouts',
    'src/core/utils',
    'src/core/router',
    'src/modules/iam/domain',
    'src/modules/iam/application/stores',
    'src/modules/iam/infrastructure',
    'src/modules/iam/presentation/views',
    'src/modules/fleet-tracking/domain',
    'src/modules/fleet-tracking/application/stores',
    'src/modules/fleet-tracking/infrastructure',
    'src/modules/fleet-tracking/presentation/views',
    'src/modules/billing-analytics/domain',
    'src/modules/billing-analytics/application/stores',
    'src/modules/billing-analytics/infrastructure',
    'src/modules/billing-analytics/presentation/views',
    'src/modules/order-management/domain/entities',
    'src/modules/order-management/domain/values',
    'src/modules/order-management/domain/repositories',
    'src/modules/order-management/application/use-cases',
    'src/modules/order-management/application/stores',
    'src/modules/order-management/infrastructure/dtos',
    'src/modules/order-management/infrastructure/mappers',
    'src/modules/order-management/infrastructure/api',
    'src/modules/order-management/presentation/views',
    'src/modules/order-management/presentation/components'
];

dirs.forEach(dir => {
    fs.mkdirSync(path.join(process.cwd(), dir), { recursive: true });
});

console.log('✅ Estructura DDD generada con éxito.');