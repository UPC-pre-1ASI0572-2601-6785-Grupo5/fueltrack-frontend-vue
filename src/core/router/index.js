import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../../modules/iam/application/stores/authStore.js'

const routes = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../../modules/iam/presentation/views/LoginView.vue')
    },
    // --- PANEL DEL SOLICITANTE (CLIENTE) ---
    {
        path: '/client',
        component: () => import('../../core/components/layouts/ClientLayout.vue'),
        meta: { requiresAuth: true, role: 'REQUESTER' },
        children: [
            {
                path: 'dashboard',
                name: 'ClientDashboard',
                component: () => import('../../modules/billing-analytics/presentation/views/ClientDashboardView.vue')
            },
            // ORDES INDEX
            {
                path: 'orders',
                name: 'ClientOrders',
                component: () => import('../../modules/order-management/presentation/views/OrderListView.vue')
            },
            {
                // Esta ruta recibe el ID del pedido dinámicamente
                path: 'tracking/:id',
                name: 'ClientTracking',
                component: () => import('../../modules/fleet-tracking/presentation/views/ClientTrackingView.vue')
            },
            {
                path: '/client/analytics',
                name: 'client-analytics',
                component: () => import('../../modules/fuel/presentation/views/ClientAnalyticsView.vue'),
                meta: { requiresAuth: true, role: 'REQUESTER' }
            },
            {
                path: '/client/orders/new',
                name: 'new-order-wizard',
                component: () => import('@/modules/fuel/presentation/views/NewOrderWizardView.vue'),
                meta: { requiresAuth: true, role: 'REQUESTER' }
            }
        ]
    },
    // --- PANEL DEL PROVEEDOR ---
    {
        path: '/provider',
        component: () => import('../../core/components/layouts/ProviderLayout.vue'),
        meta: { requiresAuth: true, role: 'PROVIDER' },
        children: [
            {
                // Este es el Centro de Control (Analítica)
                path: 'dashboard',
                name: 'ProviderDashboard',
                component: () => import('../../modules/order-management/presentation/views/ProviderDashboardView.vue')
            },
            {
                // Esta es la Gestión de Pedidos
                path: 'orders',
                name: 'ProviderOrders',
                component: () => import('../../modules/order-management/presentation/views/ProviderOrdersView.vue')
            },
            {
                // NUEVA RUTA: Inventario de Planta (Tanques)
                path: 'inventory',
                name: 'ProviderInventory',
                component: () => import('../../modules/order-management/presentation/views/ProviderInventoryView.vue')
            }
        ]
    }

    ]


const router = createRouter({
    history: createWebHistory(),
    routes
})

// Navigation Guard: Protege las rutas privadas
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        // Si intenta ir a una ruta privada sin login, lo mandamos al login
        next('/login')
    } else {
        next()
    }
})

export default router
