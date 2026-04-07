<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MoviePoster from '@/components/MoviePoster.vue'
import MovieDetailsModal from '@/components/MovieDetailsModal.vue'

const route = useRoute()
const router = useRouter()

const API_URL = 'https://api-p7h2itfhbq-uc.a.run.app'

const userId = route.params.userId
const collection = ref([])
const loading = ref(true)
const error = ref(null)
const selectedFormat = ref(null)
const searchQuery = ref('')
const sortBy = ref('title')
const selectedItem = ref(null)
const isDetailsModalOpen = ref(false)

const formats = ['bluray', 'dvd', 'vhs', '4k', 'outros']

const sortOptions = [
  { value: 'title', label: 'Título (A-Z)' },
  { value: 'title-desc', label: 'Título (Z-A)' },
  { value: 'year', label: 'Ano (mais antigo)' },
  { value: 'year-desc', label: 'Ano (mais recente)' }
]

const filteredItems = computed(() => {
  let items = collection.value

  if (selectedFormat.value) {
    items = items.filter(item => item.release?.format === selectedFormat.value)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item =>
      item.movie?.title?.toLowerCase().includes(query) ||
      item.movie?.originalTitle?.toLowerCase().includes(query)
    )
  }

  items = [...items]

  if (sortBy.value === 'title') {
    items.sort((a, b) => (a.movie?.title || '').localeCompare(b.movie?.title || ''))
  } else if (sortBy.value === 'title-desc') {
    items.sort((a, b) => (b.movie?.title || '').localeCompare(a.movie?.title || ''))
  } else if (sortBy.value === 'year') {
    items.sort((a, b) => (a.movie?.year || 0) - (b.movie?.year || 0))
  } else if (sortBy.value === 'year-desc') {
    items.sort((a, b) => (b.movie?.year || 0) - (a.movie?.year || 0))
  }

  return items
})

const stats = computed(() => {
  const items = collection.value
  return {
    total: items.length,
    bluray: items.filter(i => i.release?.format === 'bluray').length,
    dvd: items.filter(i => i.release?.format === 'dvd').length,
    vhs: items.filter(i => i.release?.format === 'vhs').length,
    '4k': items.filter(i => i.release?.format === '4k').length,
  }
})

onMounted(async () => {
  await fetchCollection()
})

async function fetchCollection() {
  try {
    loading.value = true
    const response = await fetch(`${API_URL}/collection/public/${userId}`)

    if (!response.ok) {
      throw new Error('Erro ao buscar coleção')
    }

    const data = await response.json()
    collection.value = data.items || []

  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function handleViewDetails(item) {
  selectedItem.value = item
  isDetailsModalOpen.value = true
}

function getPosterUrl(posterPath) {
  if (!posterPath) return 'https://via.placeholder.com/200x300?text=Sem+Poster'
  return `https://image.tmdb.org/t/p/w500${posterPath}`
}

function getFormatBadgeColor(format) {
  const colors = {
    'bluray': 'bg-blue-500',
    'dvd': 'bg-purple-500',
    'vhs': 'bg-yellow-500',
    '4k': 'bg-red-500',
    'outros': 'bg-gray-500'
  }
  return colors[format] || 'bg-gray-500'
}

function goToLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-primary">
    <!-- Header Público -->
    <header class="bg-secondary shadow-lg">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <h1 class="text-3xl font-bold text-gold">🎬 Du Cinéma</h1>
            <span class="text-gray-400 text-sm">Coleção Pública</span>
          </div>
          <button
            @click="goToLogin"
            class="px-4 py-2 bg-accent hover:bg-accent/90 rounded-lg transition"
          >
            Entrar
          </button>
        </div>
      </div>
    </header>

    <div class="container mx-auto px-4 py-8">
      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div class="bg-secondary rounded-lg p-4">
          <div class="text-3xl font-bold text-gold">{{ stats.total }}</div>
          <div class="text-sm text-gray-400">Total</div>
        </div>
        <div class="bg-secondary rounded-lg p-4">
          <div class="text-3xl font-bold text-blue-400">{{ stats.bluray }}</div>
          <div class="text-sm text-gray-400">Blu-ray</div>
        </div>
        <div class="bg-secondary rounded-lg p-4">
          <div class="text-3xl font-bold text-purple-400">{{ stats.dvd }}</div>
          <div class="text-sm text-gray-400">DVD</div>
        </div>
        <div class="bg-secondary rounded-lg p-4">
          <div class="text-3xl font-bold text-yellow-400">{{ stats.vhs }}</div>
          <div class="text-sm text-gray-400">VHS</div>
        </div>
        <div class="bg-secondary rounded-lg p-4">
          <div class="text-3xl font-bold text-red-400">{{ stats['4k'] }}</div>
          <div class="text-sm text-gray-400">4K</div>
        </div>
      </div>

      <!-- Busca e Ordenação -->
      <div class="mb-6 space-y-4">
        <div class="flex gap-2">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="🔍 Buscar na coleção..."
            class="flex-1 px-4 py-2 bg-secondary border border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition"
          />
          <select
            v-model="sortBy"
            class="px-4 py-2 bg-secondary border border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition"
          >
            <option v-for="option in sortOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="flex gap-2 flex-wrap">
          <button
            @click="selectedFormat = null"
            :class="[
              'px-4 py-2 rounded-lg transition',
              !selectedFormat ? 'bg-accent text-white' : 'bg-secondary text-gray-300 hover:bg-gray-700'
            ]"
          >
            Todos
          </button>
          <button
            v-for="format in formats"
            :key="format"
            @click="selectedFormat = format"
            :class="[
              'px-4 py-2 rounded-lg transition capitalize',
              selectedFormat === format ? 'bg-accent text-white' : 'bg-secondary text-gray-300 hover:bg-gray-700'
            ]"
          >
            {{ format }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-20">
        <div class="relative mb-6">
          <div class="w-20 h-20 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p class="text-xl text-gray-300 font-medium">Carregando coleção...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-12">
        <div class="text-6xl mb-4">❌</div>
        <h3 class="text-2xl font-bold mb-2">Erro ao carregar coleção</h3>
        <p class="text-gray-400">{{ error }}</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredItems.length === 0" class="text-center py-12">
        <div class="text-6xl mb-4">🎬</div>
        <h3 class="text-2xl font-bold mb-2">
          {{ searchQuery || selectedFormat ? 'Nenhum filme encontrado' : 'Coleção vazia' }}
        </h3>
        <p class="text-gray-400">
          {{ searchQuery || selectedFormat ? 'Tente ajustar os filtros' : 'Esta coleção ainda não tem filmes' }}
        </p>
      </div>

      <!-- Grid de Filmes -->
      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="bg-secondary rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer"
          @click="handleViewDetails(item)"
        >
          <!-- Poster -->
          <div class="relative aspect-[2/3] bg-gray-800">
            <MoviePoster
              :src="getPosterUrl(item.movie?.posterPath)"
              :alt="item.movie?.title"
            />
            <!-- Badge de Formato -->
            <div :class="['absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold text-white z-10', getFormatBadgeColor(item.release?.format)]">
              {{ item.release?.format?.toUpperCase() }}
            </div>
          </div>

          <!-- Info -->
          <div class="p-4">
            <h3 class="font-bold text-lg mb-1 line-clamp-2">
              {{ item.movie?.title || 'Título não disponível' }}
            </h3>
            <div class="text-sm text-gray-400 mb-2">
              {{ item.movie?.year }}
            </div>
            <div v-if="item.condition" class="text-xs text-gray-500">
              Condição: {{ item.condition }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de detalhes (modo somente leitura) -->
    <MovieDetailsModal
      v-if="selectedItem"
      :item="selectedItem"
      :is-open="isDetailsModalOpen"
      @close="isDetailsModalOpen = false"
    />
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
