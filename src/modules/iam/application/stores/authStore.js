import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { http } from '@/core/api/http.js'

export const useAuthStore = defineStore('auth', () => {
    const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
    const token = ref(localStorage.getItem('token') || null)

    const isAuthenticated = computed(() => user.value !== null && token.value !== null)
    const userRole = computed(() => user.value?.role || null)

    const _saveSession = (data) => {
        token.value = data.token
        user.value = { id: data.id, email: data.email, name: data.name, role: data.role }
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(user.value))
    }

    const login = async (email, password) => {
        const data = await http.post('/api/v1/authentication/sign-in', { email, password })
        _saveSession(data)
        return user.value
    }

    const register = async (email, password, fullName, role) => {
        const data = await http.post('/api/v1/authentication/sign-up', { email, password, fullName, role })
        _saveSession(data)
        return user.value
    }

    const logout = () => {
        user.value = null
        token.value = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    }

    return { user, token, isAuthenticated, userRole, login, register, logout }
})
