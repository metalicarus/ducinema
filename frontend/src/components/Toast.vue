<script setup>
defineProps({
  show: Boolean,
  message: String,
  type: {
    type: String,
    default: 'success'
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="toast">
      <div
        v-if="show"
        :class="[
          'fixed top-4 right-4 z-[600] px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 text-white min-w-[300px]',
          type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        ]"
      >
        <span class="text-2xl font-bold">{{ type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ' }}</span>
        <span class="text-lg">{{ message }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
