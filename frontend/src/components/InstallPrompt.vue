<script setup>
import { ref, onMounted } from 'vue'

const deferredPrompt = ref(null)
const showInstallButton = ref(false)

onMounted(() => {
  console.log('🔍 InstallPrompt montado!')
  console.log('🔍 Display mode:', window.matchMedia('(display-mode: standalone)').matches)
  
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('✅ beforeinstallprompt DISPARADO!')
    e.preventDefault()
    deferredPrompt.value = e
    showInstallButton.value = true
  })

  // Esconder botão se já estiver instalado
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('⚠️ App já está instalado')
    showInstallButton.value = false
  } else {
    console.log('⚠️ App NÃO está instalado')
  }
  
  // TESTE FORÇADO - REMOVER DEPOIS
  setTimeout(() => {
    if (!showInstallButton.value) {
      console.log('⚠️ Evento não disparou, mostrando botão de teste')
      showInstallButton.value = true
    }
  }, 2000)
})

async function installApp() {
  if (!deferredPrompt.value) {
    alert('Instalação não disponível. Use o menu do navegador para instalar.')
    return
  }

  deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice
  
  console.log('Resultado da instalação:', outcome)
  
  if (outcome === 'accepted') {
    showInstallButton.value = false
  }
  
  deferredPrompt.value = null
}
</script>

<template>
  <Transition name="fade">
    <button
      v-if="showInstallButton"
      @click="installApp"
      class="fixed bottom-4 right-4 z-[9999] px-4 py-3 bg-accent hover:bg-accent/90 rounded-lg shadow-2xl transition flex items-center gap-2 text-sm font-medium"
    >
      📱 Instalar App
    </button>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
