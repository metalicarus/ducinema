<script setup>
import { ref } from 'vue'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  }
})

const isLoaded = ref(false)
const hasError = ref(false)

function handleLoad() {
  isLoaded.value = true
}

function handleError() {
  hasError.value = true
  isLoaded.value = true
}
</script>

<template>
  <div class="relative w-full h-full bg-gray-800">
    <!-- Skeleton loading com shimmer -->
    <div
      v-show="!isLoaded"
      class="absolute inset-0 bg-gray-700 overflow-hidden"
    >
      <div class="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 animate-shimmer"></div>
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-4xl text-gray-600">🎬</div>
      </div>
    </div>

    <!-- Imagem real -->
    <img
      v-show="isLoaded && !hasError"
      :src="src"
      :alt="alt"
      @load="handleLoad"
      @error="handleError"
      class="w-full h-full object-cover transition-opacity duration-300"
      :class="{ 'opacity-0': !isLoaded }"
    />

    <!-- Fallback se der erro -->
    <div
      v-if="hasError"
      class="absolute inset-0 bg-gray-800 flex items-center justify-center"
    >
      <div class="text-center text-gray-500">
        <div class="text-4xl mb-2">🎬</div>
        <div class="text-xs">Sem poster</div>
      </div>
    </div>
  </div>
</template>
<style scoped>
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
</style>
