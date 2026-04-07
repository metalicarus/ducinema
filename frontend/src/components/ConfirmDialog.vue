<script setup>
defineProps({
  show: Boolean,
  title: {
    type: String,
    default: 'Confirmar'
  },
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: 'Confirmar'
  },
  cancelText: {
    type: String,
    default: 'Cancelar'
  }
})

const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/70" @click="emit('cancel')">
        <div
          class="bg-secondary rounded-lg shadow-2xl max-w-md w-full p-6"
          @click.stop
        >
          <h3 class="text-xl font-bold mb-3">{{ title }}</h3>
          <p class="text-gray-300 mb-6">{{ message }}</p>

          <div class="flex gap-3">
            <button
              @click="emit('cancel')"
              class="flex-1 px-4 py-2 border border-gray-600 hover:border-gray-500 rounded-lg transition"
            >
              {{ cancelText }}
            </button>
            <button
              @click="emit('confirm')"
              class="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition font-medium"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
