import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
    // Estado
    const user = ref(null)

    // Getters
    const isAuthenticated = computed(() => user.value !== null)
    const userRole = computed(() => user.value?.role || null)

    // Acciones (Casos de uso simplificados)
    const login = async (email, password) => {
        // Simulamos un retraso de red (llamada a la API)
        return new Promise((resolve) => {
            setTimeout(() => {
                // Lógica de prueba: si el correo tiene la palabra 'proveedor', le damos el rol de proveedor.
                const role = email.includes('proveedor') ? 'PROVIDER' : 'REQUESTER'

                user.value = {
                    id: 'usr-123',
                    email: email,
                    name: role === 'REQUESTER' ? 'Empresa Minera S.A.' : 'Distribuidora de Combustible SAC',
                    role: role
                }
                resolve(user.value)
            }, 800)
        })
    }

    const logout = () => {
        user.value = null
    }

    return { user, isAuthenticated, userRole, login, logout }
})