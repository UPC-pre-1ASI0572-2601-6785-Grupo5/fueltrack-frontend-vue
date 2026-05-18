<template>
  <router-view />

  <Toaster position="top-right" richColors />
</template>

<script setup>
// Importamos el componente visual de Sonner
import { Toaster } from 'vue-sonner'
</script>

<style>
/* Mantén aquí los estilos globales de CSS puro que ya tenías */
:root {
  --primary-color: #1976D2;
  --secondary-color: #424242;
  --background-color: #F5F7FA;
  --surface-color: #FFFFFF;
  --text-primary: #212121;
}

body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--background-color);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
}

* {
  box-sizing: border-box;
}
</style>