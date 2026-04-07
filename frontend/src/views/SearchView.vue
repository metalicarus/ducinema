<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSearchStore } from '@/stores/search'
import AddMovieModal from '@/components/AddMovieModal.vue'
import Toast from '@/components/Toast.vue'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import MoviePoster from '@/components/MoviePoster.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const searchStore = useSearchStore()

const searchQuery = ref('')
const selectedMovie = ref(null)
const isModalOpen = ref(false)
const showToast = ref(false)
const showLoading = ref(false)
const toastMessage = ref('')

// Carregar query da URL ao montar
onMounted(() => {
  const urlQuery = route.query.q
  if (urlQuery) {
    searchQuery.value = urlQuery
    handleSearch()
  }
})

// Atualizar URL quando buscar
watch(searchQuery, (newQuery) => {
  if (newQuery.trim()) {
    router.replace({
      path: '/search',
      query: { q: newQuery, page: searchStore.currentPage }
    })
  } else {
    router.replace({ path: '/search' })
  }
})

// Atualizar URL quando mudar de página
watch(() => searchStore.currentPage, (newPage) => {
  if (searchQuery.value.trim()) {
    router.replace({
      path: '/search',
      query: { q: searchQuery.value, page: newPage }
    })
  }
})

async function handleSearch() {
  if (!searchQuery.value.trim()) return

  try {
    const pageFromUrl = parseInt(route.query.page) || 1
    await searchStore.search(searchQuery.value, pageFromUrl)
  } catch (err) {
    console.error('Erro na busca:', err)
  }
}

function handleAddMovie(movie) {
  selectedMovie.value = movie
  isModalOpen.value = true
}

async function handleMovieAdded() {
  // 1. Mostra loading
  showLoading.value = true

  // 2. Aguarda modal fechar
  await new Promise(resolve => setTimeout(resolve, 300))

  // 3. Mostra toast de sucesso
  toastMessage.value = 'Filme adicionado à sua coleção!'
  showToast.value = true

  // 4. Aguarda 2.5 segundos
  await new Promise(resolve => setTimeout(resolve, 2500))

  // 5. Esconde toast
  showToast.value = false

  // 6. Aguarda transição
  await new Promise(resolve => setTimeout(resolve, 400))

  // 7. Remove loading
  showLoading.value = false

  // 8. NÃO redireciona - fica na tela de busca
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

function getPosterUrl(posterPath) {
  if (!posterPath) return 'https://via.placeholder.com/200x300?text=Sem+Poster'
  return `https://image.tmdb.org/t/p/w500${posterPath}`
}

// Mostrar apenas algumas páginas (ex: 1 ... 5 6 [7] 8 9 ... 50)
const visiblePages = computed(() => {
  const current = searchStore.currentPage
  const total = searchStore.totalPages
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
</script>

<template>
  <div class="min-h-screen bg-primary">
    <!-- Header -->
    <header class="bg-secondary shadow-lg">
      <div class="container mx-auto px-4 py-4">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex items-center gap-4">
            <h1 class="text-2xl md:text-3xl font-bold text-gold">🎬 Du Cinéma</h1>
            <nav class="flex gap-2 md:gap-4">
              <router-link to="/" class="text-sm md:text-base text-gray-300 hover:text-white transition">
                Minha Coleção
              </router-link>
              <router-link to="/search" class="text-sm md:text-base text-accent font-medium">
                Adicionar Filme
              </router-link>
            </nav>
          </div>
          <div class="flex items-center gap-2 md:gap-4">
            <span class="text-sm md:text-base text-gray-300 truncate max-w-[150px] md:max-w-none">
              {{ authStore.user?.displayName || authStore.user?.email }}
            </span>
            <button @click="handleLogout"
              class="px-3 py-2 md:px-4 text-sm md:text-base bg-accent hover:bg-accent/90 rounded-lg transition">
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="container mx-auto px-4 py-4 md:py-8">
      <!-- Busca -->
      <div class="max-w-2xl mx-auto mb-6 md:mb-8">
        <h2 class="text-xl md:text-2xl font-bold mb-4">Buscar Filmes</h2>
        <form @submit.prevent="handleSearch" class="flex flex-col md:flex-row gap-2">
          <input v-model="searchQuery" type="text" placeholder="Digite o título do filme..."
            class="flex-1 px-4 py-3 text-sm md:text-base bg-secondary border border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition" />
          <button type="submit" :disabled="searchStore.loading || !searchQuery.trim()"
            class="w-full md:w-auto px-6 md:px-8 py-3 text-sm md:text-base bg-accent hover:bg-accent/90 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium">
            {{ searchStore.loading ? 'Buscando...' : 'Buscar' }}
          </button>
        </form>
        <p class="text-xs md:text-sm text-gray-400 mt-2">
          💡 Dica: Digite o título para buscar filmes ou o código de barras para encontrar edições específicas
        </p>
      </div>

      <!-- Loading -->
      <div v-if="searchStore.loading" class="text-center py-12">
        <div class="text-lg md:text-xl text-gray-400">Buscando...</div>
      </div>

      <!-- Erro / Nenhum resultado -->
      <div v-else-if="searchStore.error" class="max-w-2xl mx-auto">
        <div class="text-center py-12">
          <div class="text-5xl md:text-6xl mb-4">🔍</div>
          <h3 class="text-xl md:text-2xl font-bold mb-2">Nenhum filme encontrado</h3>
          <p class="text-sm md:text-base text-gray-400 mb-2">
            Não encontramos resultados para "{{ searchQuery }}"
          </p>
          <p class="text-sm text-gray-500">
            Tente:
          </p>
          <ul class="text-sm text-gray-500 mt-2 space-y-1">
            <li>• Verificar a ortografia</li>
            <li>• Usar palavras-chave diferentes</li>
            <li>• Buscar pelo título original em inglês</li>
          </ul>
        </div>
      </div>

      <!-- Resultados -->
      <div v-else-if="searchStore.results.length > 0">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
          <h3 class="text-lg md:text-xl font-bold">
            Resultados ({{ searchStore.totalResults }})
          </h3>
          <div v-if="searchStore.totalPages > 1" class="text-xs md:text-sm text-gray-400">
            Página {{ searchStore.currentPage }} de {{ searchStore.totalPages }}
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
          <div v-for="movie in searchStore.results" :key="movie.tmdbId || movie.id"
            class="bg-secondary rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer flex flex-col"
            @click="handleAddMovie(movie)">
            <!-- Poster -->
            <div class="relative aspect-[2/3] bg-gray-800 flex-shrink-0">
              <MoviePoster :src="getPosterUrl(movie.posterPath)" :alt="movie.title" />
              <!-- Badge de origem -->
              <div class="absolute top-2 right-2 px-2 py-1 bg-blue-500 rounded text-xs font-bold text-white">
                {{ movie.source === 'tmdb' ? 'TMDB' : 'Local' }}
              </div>
            </div>

            <!-- Info -->
            <div class="p-3 md:p-4 flex flex-col flex-1">
              <!-- Título Original (maior) -->
              <h3 class="font-bold text-sm md:text-base mb-1 line-clamp-2 leading-tight">
                {{ movie.originalTitle || movie.title }}
              </h3>

              <!-- Título Traduzido (menor) -->
              <div class="h-8 md:h-10 mb-2">
                <p v-if="movie.title !== movie.originalTitle"
                  class="text-xs md:text-sm text-gray-400 line-clamp-2 leading-tight">
                  {{ movie.title }}
                </p>
              </div>

              <!-- Ano -->
              <div class="text-xs md:text-sm text-gray-500 mb-2 md:mb-3">
                {{ movie.year }}
              </div>

              <!-- Botão adicionar -->
              <button @click.stop="handleAddMovie(movie)"
                class="w-full px-3 py-2 text-xs md:text-sm bg-accent hover:bg-accent/90 rounded transition font-medium mt-auto">
                + Adicionar
              </button>
            </div>
          </div>
        </div>

        <!-- Paginação -->
        <div v-if="searchStore.totalPages > 1" class="mt-6 md:mt-8">
          <!-- Mobile: Paginação simplificada -->
          <div class="flex md:hidden items-center justify-center gap-2">
            <button @click="searchStore.previousPage()" :disabled="searchStore.currentPage === 1"
              class="px-4 py-2 bg-secondary border border-gray-600 rounded-lg hover:border-accent transition disabled:opacity-50 disabled:cursor-not-allowed text-sm">
              ‹
            </button>
            <span class="px-4 py-2 text-sm">
              {{ searchStore.currentPage }} / {{ searchStore.totalPages }}
            </span>
            <button @click="searchStore.nextPage()" :disabled="searchStore.currentPage === searchStore.totalPages"
              class="px-4 py-2 bg-secondary border border-gray-600 rounded-lg hover:border-accent transition disabled:opacity-50 disabled:cursor-not-allowed text-sm">
              ›
            </button>
          </div>

          <!-- Desktop: Paginação completa -->
          <div class="hidden md:flex items-center justify-center gap-2">
            <button @click="searchStore.goToPage(1)" :disabled="searchStore.currentPage === 1"
              class="px-4 py-2 bg-secondary border border-gray-600 rounded-lg hover:border-accent transition disabled:opacity-50 disabled:cursor-not-allowed">
              ««
            </button>

            <button @click="searchStore.previousPage()" :disabled="searchStore.currentPage === 1"
              class="px-4 py-2 bg-secondary border border-gray-600 rounded-lg hover:border-accent transition disabled:opacity-50 disabled:cursor-not-allowed">
              « Anterior
            </button>

            <div class="flex gap-2">
              <button v-for="page in visiblePages" :key="page" @click="searchStore.goToPage(page)" :class="[
                'px-4 py-2 rounded-lg transition',
                page === searchStore.currentPage
                  ? 'bg-accent text-white'
                  : 'bg-secondary border border-gray-600 hover:border-accent'
              ]">
                {{ page }}
              </button>
            </div>

            <button @click="searchStore.nextPage()" :disabled="searchStore.currentPage === searchStore.totalPages"
              class="px-4 py-2 bg-secondary border border-gray-600 rounded-lg hover:border-accent transition disabled:opacity-50 disabled:cursor-not-allowed">
              Próxima »
            </button>

            <button @click="searchStore.goToPage(searchStore.totalPages)"
              :disabled="searchStore.currentPage === searchStore.totalPages"
              class="px-4 py-2 bg-secondary border border-gray-600 rounded-lg hover:border-accent transition disabled:opacity-50 disabled:cursor-not-allowed">
              »»
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="searchQuery" class="text-center py-12">
        <div class="text-5xl md:text-6xl mb-4">🔍</div>
        <h3 class="text-xl md:text-2xl font-bold mb-2">Nenhum resultado encontrado</h3>
        <p class="text-sm md:text-base text-gray-400">Tente buscar com outro termo</p>
      </div>

      <!-- Initial State -->
      <div v-else class="text-center py-12">
        <div class="text-5xl md:text-6xl mb-4">🎬</div>
        <h3 class="text-xl md:text-2xl font-bold mb-2">Busque e adicione filmes</h3>
        <p class="text-sm md:text-base text-gray-400">Digite o título de um filme ou código de barras acima</p>
      </div>
    </div>

    <!-- Modal de adicionar -->
    <AddMovieModal v-if="selectedMovie" :movie="selectedMovie" :is-open="isModalOpen" @close="isModalOpen = false"
      @adding="showLoading = true" @added="handleMovieAdded"
      @error="(err) => { showLoading = false; toastMessage = err; showToast = true }" />

    <!-- Loading Fullscreen -->
    <LoadingOverlay :show="showLoading" message="Adicionando filme à sua coleção..." />

    <!-- Toast de sucesso -->
    <Toast :show="showToast" :message="toastMessage" type="success" />
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
