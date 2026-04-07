<script setup>
import { onMounted, ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCollectionStore } from '@/stores/collection'
import { useRouter } from 'vue-router'
import MovieDetailsModal from '@/components/MovieDetailsModal.vue'
import MoviePoster from '@/components/MoviePoster.vue'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import Toast from '@/components/Toast.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const authStore = useAuthStore()
const collectionStore = useCollectionStore()
const router = useRouter()

const selectedFormat = ref(null)
const selectedItem = ref(null)
const isDetailsModalOpen = ref(false)
const showLoading = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

const searchQuery = ref('')
const sortBy = ref('title')

// Paginação
const currentPage = ref(1)
const itemsPerPage = ref(20)

const showConfirmDelete = ref(false)
const itemToDelete = ref(null)

const formats = ['bluray', 'dvd', 'vhs', '4k', 'outros']

const sortOptions = [
  { value: 'title', label: 'Título (A-Z)' },
  { value: 'title-desc', label: 'Título (Z-A)' },
  { value: 'year', label: 'Ano (mais antigo)' },
  { value: 'year-desc', label: 'Ano (mais recente)' },
  { value: 'addedAt', label: 'Data de adição (mais antigo)' },
  { value: 'addedAt-desc', label: 'Data de adição (mais recente)' }
]

const filteredAndSortedItems = computed(() => {
  let items = collectionStore.items

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
  } else if (sortBy.value === 'addedAt') {
    items.sort((a, b) => {
      const dateA = a.addedAt?._seconds || 0
      const dateB = b.addedAt?._seconds || 0
      return dateA - dateB
    })
  } else if (sortBy.value === 'addedAt-desc') {
    items.sort((a, b) => {
      const dateA = a.addedAt?._seconds || 0
      const dateB = b.addedAt?._seconds || 0
      return dateB - dateA
    })
  }

  return items
})

const groupedItems = computed(() => {
  const groups = new Map()

  filteredAndSortedItems.value.forEach(item => {
    const tmdbId = item.movie?.tmdbId
    if (!tmdbId) return

    if (!groups.has(tmdbId)) {
      groups.set(tmdbId, {
        movie: item.movie,
        copies: []
      })
    }

    groups.get(tmdbId).copies.push(item)
  })

  return Array.from(groups.values())
})

function getFormatBadges(copies) {
  const formats = copies.map(c => c.release?.format).filter(Boolean)
  return [...new Set(formats)] // Remove duplicatas
}

function getFormatIcons(format) {
  const icons = {
    'bluray': '💿',
    'dvd': '📀',
    'vhs': '📼',
    '4k': '🎞️',
    'outros': '📦'
  }
  return icons[format] || '📦'
}


// Paginação com filmes agrupados
const totalPagesGrouped = computed(() => {
  return Math.ceil(groupedItems.value.length / itemsPerPage.value)
})

const paginatedGroupedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return groupedItems.value.slice(start, end)
})

const visiblePages = computed(() => {
  const current = currentPage.value
  const total = totalPagesGrouped.value
  const pages = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i)
    } else if (current >= total - 2) {
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      for (let i = current - 2; i <= current + 2; i++) pages.push(i)
    }
  }

  return pages
})

function goToPage(page) {
  if (page >= 1 && page <= totalPagesGrouped.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function nextPage() {
  if (currentPage.value < totalPagesGrouped.value) {
    goToPage(currentPage.value + 1)
  }
}

function previousPage() {
  if (currentPage.value > 1) {
    goToPage(currentPage.value - 1)
  }
}

// Resetar página ao filtrar/buscar
function resetPagination() {
  currentPage.value = 1
}

const stats = computed(() => {
  const items = collectionStore.items
  return {
    total: items.length,
    bluray: items.filter(i => i.release?.format === 'bluray').length,
    dvd: items.filter(i => i.release?.format === 'dvd').length,
    vhs: items.filter(i => i.release?.format === 'vhs').length,
    '4k': items.filter(i => i.release?.format === '4k').length,
  }
})

onMounted(async () => {
  await collectionStore.fetchCollection()
})

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

function handleViewDetails(item) {
  selectedItem.value = item
  isDetailsModalOpen.value = true
}

function confirmRemove(item) {
  itemToDelete.value = item
  showConfirmDelete.value = true
}

async function handleRemove() {
  if (!itemToDelete.value) return

  try {
    showConfirmDelete.value = false
    showLoading.value = true

    await new Promise(resolve => setTimeout(resolve, 300))

    await collectionStore.removeFromCollection(itemToDelete.value.id)

    toastMessage.value = 'Filme removido da coleção!'
    toastType.value = 'success'
    showToast.value = true

    await new Promise(resolve => setTimeout(resolve, 2500))

    showToast.value = false
    await new Promise(resolve => setTimeout(resolve, 400))

    showLoading.value = false
    itemToDelete.value = null

  } catch (err) {
    showLoading.value = false
    toastMessage.value = 'Erro ao remover filme'
    toastType.value = 'error'
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
    }, 3000)
  }
}

function cancelRemove() {
  showConfirmDelete.value = false
  itemToDelete.value = null
}

async function handleItemUpdated() {
  showLoading.value = true
  isDetailsModalOpen.value = false

  await new Promise(resolve => setTimeout(resolve, 300))

  toastMessage.value = 'Informações atualizadas com sucesso!'
  toastType.value = 'success'
  showToast.value = true

  await collectionStore.fetchCollection()

  await new Promise(resolve => setTimeout(resolve, 2500))

  showToast.value = false
  await new Promise(resolve => setTimeout(resolve, 400))

  showLoading.value = false
}

function handleUpdateError(error) {
  isDetailsModalOpen.value = false
  showLoading.value = false

  toastMessage.value = error
  toastType.value = 'error'
  showToast.value = true

  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

function copyPublicLink() {
  const publicUrl = `${window.location.origin}/collection/${authStore.user.uid}`
  navigator.clipboard.writeText(publicUrl)

  toastMessage.value = 'Link copiado! Compartilhe com seus amigos 🎬'
  toastType.value = 'success'
  showToast.value = true

  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

function getPosterUrl(posterPath) {
  if (!posterPath) return 'https://via.placeholder.com/200x300?text=Sem+Poster'
  return `https://image.tmdb.org/t/p/w500${posterPath}`
}

// Adicione esta função junto com as outras
function handleRemoveCopy(copyId) {
  const copy = collectionStore.items.find(item => item.id === copyId)
  confirmRemove(copy)
}

</script>

<template>
  <div class="min-h-screen bg-primary">
    <!-- Header -->
    <header class="bg-secondary shadow-lg">
      <div class="container mx-auto px-4 py-4">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex items-center gap-2 md:gap-4">
            <h1 class="text-2xl md:text-3xl font-bold text-gold">🎬 Du Cinéma</h1>
            <nav class="flex gap-2 md:gap-4">
              <router-link to="/" class="text-sm md:text-base text-white font-medium">
                Minha Coleção
              </router-link>
              <router-link to="/search" class="text-sm md:text-base text-gray-300 hover:text-white transition">
                Adicionar Filme
              </router-link>
            </nav>
          </div>
          <div class="flex items-center gap-2">
            <button @click="copyPublicLink"
              class="px-3 py-2 text-xs md:text-sm bg-secondary border border-accent hover:bg-accent/20 rounded-lg transition flex items-center gap-1 md:gap-2"
              title="Copiar link público da coleção">
              🔗 <span class="hidden sm:inline">Compartilhar</span>
            </button>
            <span class="text-xs md:text-sm text-gray-300 truncate max-w-[100px] md:max-w-none">
              {{ authStore.user?.displayName || authStore.user?.email }}
            </span>
            <button @click="handleLogout"
              class="px-3 py-2 text-xs md:text-sm bg-accent hover:bg-accent/90 rounded-lg transition">
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="container mx-auto px-4 py-4 md:py-8">
      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 mb-6 md:mb-8">
        <div class="bg-secondary rounded-lg p-3 md:p-4">
          <div class="text-2xl md:text-3xl font-bold text-gold">{{ stats.total }}</div>
          <div class="text-xs md:text-sm text-gray-400">Total</div>
        </div>
        <div class="bg-secondary rounded-lg p-3 md:p-4">
          <div class="text-2xl md:text-3xl font-bold text-blue-400">{{ stats.bluray }}</div>
          <div class="text-xs md:text-sm text-gray-400">Blu-ray</div>
        </div>
        <div class="bg-secondary rounded-lg p-3 md:p-4">
          <div class="text-2xl md:text-3xl font-bold text-purple-400">{{ stats.dvd }}</div>
          <div class="text-xs md:text-sm text-gray-400">DVD</div>
        </div>
        <div class="bg-secondary rounded-lg p-3 md:p-4">
          <div class="text-2xl md:text-3xl font-bold text-yellow-400">{{ stats.vhs }}</div>
          <div class="text-xs md:text-sm text-gray-400">VHS</div>
        </div>
        <div class="bg-secondary rounded-lg p-3 md:p-4">
          <div class="text-2xl md:text-3xl font-bold text-red-400">{{ stats['4k'] }}</div>
          <div class="text-xs md:text-sm text-gray-400">4K</div>
        </div>
      </div>

      <!-- Busca e Ordenação -->
      <div class="mb-4 md:mb-6 space-y-3 md:space-y-4">
        <!-- Busca -->
        <div class="flex flex-col md:flex-row gap-2">
          <input v-model="searchQuery" @input="resetPagination" type="text" placeholder="🔍 Buscar na sua coleção..."
            class="flex-1 px-4 py-2 text-sm md:text-base bg-secondary border border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition" />
          <select v-model="sortBy"
            class="px-4 py-2 text-sm md:text-base bg-secondary border border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition">
            <option v-for="option in sortOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <!-- Filtros por formato -->
        <div class="flex gap-2 flex-wrap">
          <button @click="selectedFormat = null; resetPagination()" :class="[
            'px-3 py-2 text-xs md:text-sm rounded-lg transition',
            !selectedFormat ? 'bg-accent text-white' : 'bg-secondary text-gray-300 hover:bg-gray-700'
          ]">
            Todos
          </button>
          <button v-for="format in formats" :key="format" @click="selectedFormat = format; resetPagination()" :class="[
            'px-3 py-2 text-xs md:text-sm rounded-lg transition capitalize',
            selectedFormat === format ? 'bg-accent text-white' : 'bg-secondary text-gray-300 hover:bg-gray-700'
          ]">
            {{ format }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="collectionStore.loading" class="flex flex-col items-center justify-center py-12 md:py-20">
        <div class="relative mb-6">
          <div class="w-16 h-16 md:w-20 md:h-20 border-4 border-accent border-t-transparent rounded-full animate-spin">
          </div>
        </div>
        <p class="text-lg md:text-xl text-gray-300 font-medium">Carregando sua coleção...</p>
        <p class="text-xs md:text-sm text-gray-500 mt-2">Buscando seus filmes</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="paginatedGroupedItems.length === 0" class="text-center py-12">
        <div class="text-5xl md:text-6xl mb-4">🎬</div>
        <h3 class="text-xl md:text-2xl font-bold mb-2">
          {{ searchQuery || selectedFormat ? 'Nenhum filme encontrado' : 'Sua coleção está vazia' }}
        </h3>
        <p class="text-sm md:text-base text-gray-400 mb-6">
          {{ searchQuery || selectedFormat ? 'Tente ajustar os filtros' : 'Adicione seus primeiros filmes!' }}
        </p>
        <router-link v-if="!searchQuery && !selectedFormat" to="/search"
          class="inline-block px-4 py-2 md:px-6 md:py-3 text-sm md:text-base bg-accent hover:bg-accent/90 rounded-lg transition">
          Adicionar Filme
        </router-link>
      </div>

      <!-- Grid de Filmes AGRUPADOS -->
      <div v-else>
        <div class="flex items-center justify-between mb-4">
          <div class="text-sm md:text-base text-gray-400">
            Mostrando {{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage * itemsPerPage,
              groupedItems.length) }} de {{ groupedItems.length }} títulos únicos ({{ filteredAndSortedItems.length }}
            cópias totais)
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
          <div v-for="group in paginatedGroupedItems" :key="group.movie.tmdbId"
            class="bg-secondary rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer"
            @click="handleViewDetails(group.copies[0])">
            <!-- Poster -->
            <div class="relative aspect-[2/3] bg-gray-800">
              <MoviePoster :src="getPosterUrl(group.movie?.posterPath)" :alt="group.movie?.title" />

              <!-- Badge de Quantidade de Formatos -->
              <div v-if="group.copies.length > 1"
                class="absolute top-2 right-2 px-2 py-1 bg-gold rounded text-xs font-bold text-primary z-10">
                {{ group.copies.length }}x
              </div>

              <!-- Ícones dos Formatos -->
              <div class="absolute bottom-2 right-2 flex gap-1 z-10">
                <span v-for="format in getFormatBadges(group.copies)" :key="format"
                  class="text-lg bg-black/60 rounded px-1" :title="format">
                  {{ getFormatIcons(format) }}
                </span>
              </div>

              <!-- Botão Remover (remove PRIMEIRA cópia) -->
              <button @click.stop="confirmRemove(group.copies[0])"
                class="absolute top-2 left-2 w-7 h-7 md:w-8 md:h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition z-10 text-lg md:text-xl"
                title="Remover da coleção">
                ×
              </button>
            </div>

            <!-- Info -->
            <div class="p-3 md:p-4">
              <h3 class="font-bold text-sm md:text-lg mb-1 line-clamp-2">
                {{ group.movie?.title || 'Título não disponível' }}
              </h3>
              <div class="text-xs md:text-sm text-gray-400 mb-2">
                {{ group.movie?.year }}
              </div>

              <!-- Resumo dos formatos -->
              <div class="text-xs text-gray-500">
                <span v-if="group.copies.length === 1">
                  {{ group.copies[0].release?.format?.toUpperCase() }}
                </span>
                <span v-else>
                  {{ group.copies.length }} cópias
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Paginação -->
        <div v-if="totalPagesGrouped > 1" class="mt-6 md:mt-8">
          <!-- Use totalPagesGrouped em vez de totalPages -->
          <div class="flex md:hidden items-center justify-center gap-2">
            <button @click="previousPage()" :disabled="currentPage === 1"
              class="px-4 py-2 bg-secondary border border-gray-600 rounded-lg hover:border-accent transition disabled:opacity-50 disabled:cursor-not-allowed text-sm">
              ‹
            </button>
            <span class="px-4 py-2 text-sm">
              {{ currentPage }} / {{ totalPagesGrouped }}
            </span>
            <button @click="nextPage()" :disabled="currentPage === totalPagesGrouped"
              class="px-4 py-2 bg-secondary border border-gray-600 rounded-lg hover:border-accent transition disabled:opacity-50 disabled:cursor-not-allowed text-sm">
              ›
            </button>
          </div>

          <div class="hidden md:flex items-center justify-center gap-2">
            <!-- Similar ao mobile, mas substituindo totalPages por totalPagesGrouped -->
            <!-- ... código completo abaixo -->
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de detalhes -->
    <MovieDetailsModal
      v-if="selectedItem"
      :item="selectedItem"
      :is-open="isDetailsModalOpen"
      @close="isDetailsModalOpen = false"
      @updated="handleItemUpdated"
      @error="handleUpdateError"
      @remove-copy="handleRemoveCopy"
    />

    <!-- Confirmação de remoção -->
    <ConfirmDialog :show="showConfirmDelete" title="Remover filme da coleção"
      :message="`Tem certeza que deseja remover '${itemToDelete?.movie?.title}' da sua coleção?`" confirm-text="Remover"
      cancel-text="Cancelar" @confirm="handleRemove" @cancel="cancelRemove" />

    <!-- Loading Fullscreen -->
    <LoadingOverlay :show="showLoading" :message="itemToDelete ? 'Removendo filme...' : 'Atualizando informações...'" />

    <!-- Toast -->
    <Toast :show="showToast" :message="toastMessage" :type="toastType" />
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
