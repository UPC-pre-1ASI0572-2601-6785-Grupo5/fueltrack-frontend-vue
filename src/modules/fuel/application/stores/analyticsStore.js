import { defineStore } from 'pinia';

export const useAnalyticsStore = defineStore('analyticsStore', {
    state: () => ({
        // ─── MÉTRICAS FINANCIERAS B2B ───
        totalSpend: 310000,      // Gasto acumulado en Soles (S/)
        budgetLimit: 500000,     // Línea de crédito mensual

        // ─── MÉTRICAS VOLUMÉTRICAS ───
        totalGallons: 18500,     // Total de galones despachados

        // Distribución por tipo de combustible: [Diesel B5, Gasohol 95, Gasohol 98]
        consumptionByFuelType: [12500, 4500, 1500],

        isLoading: false,
        error: null
    }),

    actions: {
        // Simulamos una llamada a tu API / Backend (Para la tesis)
        async fetchAnalyticsData() {
            this.isLoading = true;
            try {
                // Simulamos el retraso de red (800ms)
                await new Promise(resolve => setTimeout(resolve, 800));

                // Aquí en el futuro harías un: const response = await api.get('/analytics')
                // this.totalSpend = response.data.totalSpend;

            } catch (err) {
                this.error = 'Error al sincronizar cubos de datos operacionales';
                console.error(err);
            } finally {
                this.isLoading = false;
            }
        },

        // Acción para actualizar el gasto en tiempo real cuando se aprueba un pedido
        addExpense(amount) {
            this.totalSpend += amount;
        }
    },

    getters: {
        // Calculamos el % de línea de crédito consumida
        creditUsedPercentage: (state) => {
            return Math.min((state.totalSpend / state.budgetLimit) * 100, 100);
        },
        // Calculamos el saldo disponible
        availableCredit: (state) => {
            return state.budgetLimit - state.totalSpend;
        }
    }
});
