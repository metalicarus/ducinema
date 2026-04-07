<script setup>
defineProps({
  show: Boolean,
  message: {
    type: String,
    default: 'Carregando...'
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 z-[500] bg-black/80 flex items-center justify-center backdrop-blur-sm"
      >
        <div class="text-center">
          <!-- Spinner -->
          <div class="inline-block mb-4">
            <div class="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
          <!-- Mensagem -->
          <p class="text-xl text-white font-medium">{{ message }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
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
