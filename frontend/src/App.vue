<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'
import InstallPrompt from './components/InstallPrompt.vue'

const authStore = useAuthStore()

onMounted(() => {
  authStore.initAuth()
})
</script>

<template>
  <div id="app" class="min-h-screen">
    <RouterView />
    <InstallPrompt />
  </div>
</template>
