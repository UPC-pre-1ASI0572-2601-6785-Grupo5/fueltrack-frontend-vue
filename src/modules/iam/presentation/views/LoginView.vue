<template>
  <div class="login-page">
    <div class="login-side">
      <div class="login-content">

        <div class="brand-header">
          <div class="logo-box">
            <DropletsIcon :size="28" class="text-white" />
          </div>
          <div class="brand-info">
            <h1>FuelTrack</h1>
            <span class="badge">Sistemas Logísticos B2B</span>
          </div>
        </div>

        <div class="welcome-text">
          <h2>¡Bienvenido de nuevo!</h2>
          <p>Ingresa tus credenciales para acceder al panel operativo.</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">

          <div class="form-group">
            <label for="email">Correo Institucional</label>
            <div class="input-wrapper">
              <MailIcon :size="18" class="input-icon" />
              <input
                  type="email"
                  id="email"
                  v-model="email"
                  placeholder="usuario@empresa.com"
                  required
                  :disabled="isLoading"
                  autocomplete="email"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <div class="input-wrapper">
              <LockIcon :size="18" class="input-icon" />
              <input
                  :type="showPassword ? 'text' : 'password'"
                  id="password"
                  v-model="password"
                  placeholder="••••••••"
                  required
                  :disabled="isLoading"
                  autocomplete="current-password"
              />
              <button
                  type="button"
                  class="btn-toggle-pw"
                  @click="showPassword = !showPassword"
                  tabindex="-1"
              >
                <EyeIcon v-if="!showPassword" :size="18" />
                <EyeOffIcon v-else :size="18" />
              </button>
            </div>
          </div>

          <div class="form-options">
            <label class="checkbox-container">
              <input type="checkbox" v-model="rememberMe">
              <span class="checkmark"></span>
              Recordar sesión
            </label>
            <a href="#" class="forgot-link">¿Olvidaste tu contraseña?</a>
          </div>

          <button type="submit" class="btn-login" :disabled="isLoading">
            <Loader2Icon v-if="isLoading" :size="20" class="spinner" />
            <span v-else>Ingresar a la Plataforma</span>
          </button>
        </form>

        <footer class="login-footer">
          <p>&copy; 2026 FuelTrack Tech. Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>

    <div class="visual-side">
      <div class="overlay-gradient"></div>
      <div class="visual-content">
        <div class="glass-card">
          <div class="quote-icon">“</div>
          <p class="visual-quote">
            Optimiza tu cadena de suministro con monitoreo satelital en tiempo real y gestión inteligente de pedidos.
          </p>
          <div class="visual-stats">
            <div class="stat-item">
              <strong>+15%</strong>
              <span>Ahorro Logístico</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <strong>99.9%</strong>
              <span>Uptime Satelital</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../application/stores/authStore.js'; // Verifica que la ruta sea correcta
import { toast } from 'vue-sonner';

// Iconografía Lucide
import {
  DropletsIcon, MailIcon, LockIcon,
  EyeIcon, EyeOffIcon, Loader2Icon
} from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

// Estados reactivos
const email = ref('');
const password = ref('');
const isLoading = ref(false);
const showPassword = ref(false);
const rememberMe = ref(false);

/**
 * Maneja el flujo de autenticación y redirección por roles
 */
const handleLogin = async () => {
  if (isLoading.value) return;

  isLoading.value = true;
  try {
    const success = await authStore.login(email.value, password.value);

    if (success) {
      toast.success('Acceso autorizado', {
        description: `Bienvenido al sistema FuelTrack.`
      });

      // Redirección lógica basada en el rol del usuario
      if (authStore.userRole === 'REQUESTER') {
        router.push('/client/dashboard');
      } else {
        router.push('/provider/dashboard');
      }
    } else {
      toast.error('Credenciales incorrectas', {
        description: 'El correo o la contraseña no coinciden con nuestros registros.'
      });
    }
  } catch (error) {
    toast.error('Error del sistema', {
      description: 'No se pudo conectar con el servidor de autenticación.'
    });
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* CONFIGURACIÓN ESTRUCTURAL */
.login-page {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  background-color: #FFFFFF;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* --- LADO IZQUIERDO: FORMULARIO --- */
.login-side {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.login-content {
  width: 100%;
  max-width: 440px;
}

/* Header y Logo */
.brand-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 40px;
}

.logo-box {
  width: 52px; height: 52px;
  background: linear-gradient(135deg, #2563EB, #1D4ED8);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
  flex-shrink: 0;
}

.text-white { color: white; }
.brand-info h1 { font-size: 24px; font-weight: 800; color: #111827; margin: 0; letter-spacing: -0.5px; }
.brand-info .badge { font-size: 11px; color: #6B7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

/* Textos de Bienvenida */
.welcome-text { margin-bottom: 32px; }
.welcome-text h2 { font-size: 30px; font-weight: 800; color: #111827; margin: 0 0 8px; letter-spacing: -1px; }
.welcome-text p { color: #6B7280; font-size: 16px; line-height: 1.5; }

/* Estilos de Input Premium */
.login-form { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 14px; font-weight: 700; color: #374151; }

.input-wrapper { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 14px; color: #9CA3AF; pointer-events: none; }

.input-wrapper input {
  width: 100%;
  padding: 14px 14px 14px 44px;
  border: 1.5px solid #E5E7EB;
  border-radius: 12px;
  font-size: 15px;
  background-color: #F9FAFB;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: #111827;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #2563EB;
  background-color: #FFFFFF;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

.btn-toggle-pw {
  position: absolute; right: 14px;
  background: none; border: none;
  color: #9CA3AF; cursor: pointer;
  padding: 4px; display: flex; transition: color 0.2s;
}
.btn-toggle-pw:hover { color: #374151; }

/* Opciones extras */
.form-options { display: flex; justify-content: space-between; align-items: center; font-size: 14px; margin-top: 4px; }
.checkbox-container { display: flex; align-items: center; gap: 8px; cursor: pointer; color: #4B5563; font-weight: 500; }
.forgot-link { color: #2563EB; font-weight: 700; text-decoration: none; }
.forgot-link:hover { text-decoration: underline; }

/* Botón de Acción Principal */
.btn-login {
  margin-top: 12px;
  padding: 16px;
  background-color: #111827;
  color: #FFFFFF;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.btn-login:hover:not(:disabled) { background-color: #1F2937; transform: translateY(-1px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
.btn-login:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner { animation: spin 1s linear infinite; }

.login-footer { margin-top: 48px; font-size: 13px; color: #9CA3AF; text-align: center; }

/* --- LADO DERECHO: VISUAL / GLASSMORPHISM --- */
.visual-side {
  flex: 1.2;
  position: relative;
  background-image: url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000');
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
}

.overlay-gradient {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.85), rgba(17, 24, 39, 0.95));
}

.visual-content { position: relative; z-index: 2; width: 100%; max-width: 540px; }

.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 32px;
  padding: 48px;
  color: #FFFFFF;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.quote-icon { font-size: 80px; line-height: 1; margin-bottom: 24px; opacity: 0.4; font-family: 'Times New Roman', serif; }
.visual-quote { font-size: 24px; font-weight: 500; line-height: 1.5; margin-bottom: 40px; letter-spacing: -0.5px; }

.visual-stats { display: flex; gap: 40px; }
.stat-item { display: flex; flex-direction: column; gap: 4px; }
.stat-item strong { font-size: 28px; font-weight: 800; color: #FFFFFF; }
.stat-item span { font-size: 14px; opacity: 0.8; font-weight: 600; color: #E5E7EB; }
.stat-divider { width: 1.5px; height: 48px; background: rgba(255,255,255,0.2); }

/* --- RESPONSIVE --- */
@media (max-width: 1024px) {
  .visual-side { display: none; } /* Ocultamos la imagen en tablets y celulares */
  .login-side { background-color: #F9FAFB; }
}

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>