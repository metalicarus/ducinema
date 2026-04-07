<script setup>
import { ref, computed, watch } from 'vue'
import { useSearchStore } from '@/stores/search'
import { useCollectionStore } from '@/stores/collection'

const API_URL = 'https://api-p7h2itfhbq-uc.a.run.app'
const props = defineProps({
  movie: {
    type: Object,
    required: true
  },
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'adding', 'added', 'error'])

const searchStore = useSearchStore()
const collectionStore = useCollectionStore()

const activeTab = ref('add')
const movieDetails = ref(null)
const loadingDetails = ref(false)

// Form fields
const format = ref('bluray')
const barcode = ref('')
const condition = ref('usado')
const location = ref('')
const price = ref(null)
const notes = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const formats = [
  { value: 'bluray', label: 'Blu-ray' },
  { value: 'dvd', label: 'DVD' },
  { value: 'vhs', label: 'VHS' },
  { value: '4k', label: '4K Ultra HD' },
  { value: 'outros', label: 'Outros' }
]

const conditions = [
  { value: 'novo', label: 'Novo/Lacrado' },
  { value: 'usado', label: 'Usado' },
  { value: 'danificado', label: 'Danificado' }
]

const posterUrl = computed(() => {
  const movie = movieDetails.value || props.movie
  if (!movie.posterPath) return 'https://via.placeholder.com/300x450?text=Sem+Poster'
  return `https://image.tmdb.org/t/p/w500${movie.posterPath}`
})

const backdropUrl = computed(() => {
  if (!movieDetails.value?.backdropPath) return null
  return `https://image.tmdb.org/t/p/w1280${movieDetails.value.backdropPath}`
})

// Buscar detalhes quando o modal abre
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen && !movieDetails.value) {
    fetchMovieDetails()
  }
})

async function fetchMovieDetails() {
  try {
    loadingDetails.value = true

    // Busca detalhes completos do TMDB via backend
    const response = await fetch(`${API_URL}/movies/details/${props.movie.tmdbId}`)

    if (!response.ok) {
      throw new Error('Erro ao buscar detalhes')
    }

    const data = await response.json()
    movieDetails.value = data

  } catch (err) {
    console.error('Erro ao buscar detalhes:', err)
    // Fallback para dados que já temos
    movieDetails.value = {
      ...props.movie,
      overview: props.movie.overview || 'Sinopse não disponível.',
      director: props.movie.director || null,
      cast: props.movie.cast || [],
      runtime: props.movie.runtime || 0,
      voteAverage: props.movie.voteAverage || 0,
      trailer: props.movie.trailer || null
    }
  } finally {
    loadingDetails.value = false
  }
}

async function handleSubmit() {
  try {
    errorMessage.value = ''

    // 1. EMITE EVENTO PARA MOSTRAR LOADING (ANTES DE TUDO)
    emit('adding')

    // 2. Pequeno delay para garantir que o loading apareça
    await new Promise(resolve => setTimeout(resolve, 100))

    // 3. Agora sim faz as requisições
    isLoading.value = true

    const result = await searchStore.addMovieFromTMDB(
      props.movie.tmdbId,
      format.value,
      barcode.value || null
    )

    await collectionStore.addToCollection(result.release.id, {
      condition: condition.value,
      location: location.value || null,
      price: price.value || null,
      notes: notes.value || null
    })

    // 4. Sucesso! Fecha modal e notifica
    emit('close')
    resetForm()
    emit('added')

  } catch (err) {
    errorMessage.value = err.message
    emit('error', err.message)
    isLoading.value = false
  }
}

function resetForm() {
  activeTab.value = 'add'
  movieDetails.value = null
  format.value = 'bluray'
  barcode.value = ''
  condition.value = 'usado'
  location.value = ''
  price.value = null
  notes.value = ''
  errorMessage.value = ''
}

function handleClose() {
  resetForm()
  emit('close')
}

function getActorPhotoUrl(profilePath) {
  if (!profilePath) return 'https://via.placeholder.com/100x150?text=N/A'
  return `https://image.tmdb.org/t/p/w185${profilePath}`
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" @click="handleClose">
        <div
          class="bg-secondary rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          @click.stop
        >
          <!-- Header com backdrop -->
          <div class="relative h-48 bg-gray-800 flex-shrink-0">
            <img
              v-if="backdropUrl"
              :src="backdropUrl"
              :alt="movie.title"
              class="w-full h-full object-cover opacity-50"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-secondary to-transparent"></div>

            <div class="absolute bottom-0 left-0 right-0 p-6 flex items-end gap-4">
              <img
                :src="posterUrl"
                :alt="movie.title"
                class="w-24 h-36 object-cover rounded shadow-2xl flex-shrink-0"
              />
              <div class="flex-1 min-w-0">
                <h2 class="text-3xl font-bold mb-1 truncate">{{ movie.title }}</h2>
                <p class="text-gray-300 text-sm truncate">{{ movie.originalTitle }}</p>
                <div class="flex gap-4 text-sm text-gray-300 mt-2">
                  <span>{{ movie.year }}</span>
                  <span v-if="movieDetails?.runtime">{{ movieDetails.runtime }} min</span>
                  <span v-if="movieDetails?.voteAverage" class="flex items-center gap-1">
                    ⭐ {{ movieDetails.voteAverage.toFixed(1) }}
                  </span>
                </div>
              </div>
              <button
                @click="handleClose"
                class="text-gray-400 hover:text-white text-3xl flex-shrink-0"
              >
                ×
              </button>
            </div>
          </div>

          <!-- Tabs -->
          <div class="border-b border-gray-700 flex-shrink-0">
            <div class="flex">
              <button
                @click="activeTab = 'add'"
                :class="[
                  'px-6 py-3 font-medium transition',
                  activeTab === 'add'
                    ? 'text-accent border-b-2 border-accent'
                    : 'text-gray-400 hover:text-white'
                ]"
              >
                Adicionar à Coleção
              </button>
              <button
                @click="activeTab = 'details'"
                :class="[
                  'px-6 py-3 font-medium transition',
                  activeTab === 'details'
                    ? 'text-accent border-b-2 border-accent'
                    : 'text-gray-400 hover:text-white'
                ]"
              >
                Detalhes
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto">
            <!-- Tab: Detalhes -->
            <div v-show="activeTab === 'details'" class="p-6 space-y-6">
              <!-- Loading -->
              <div v-if="loadingDetails" class="text-center py-8">
                <div class="w-12 h-12 border-4 border-accent animate-spin"></div>
                <p>Carregando detalhes...</p>
              </div>

              <div v-else>
                <!-- Gêneros -->
                <div v-if="movieDetails?.genres?.length">
                  <div class="flex gap-2 flex-wrap mb-4">
                    <span
                      v-for="genre in movieDetails.genres"
                      :key="genre"
                      class="px-3 py-1 bg-primary rounded-full text-sm"
                    >
                      {{ genre }}
                    </span>
                  </div>
                </div>

                <!-- Sinopse -->
                <div>
                  <h3 class="text-xl font-bold mb-2">Sinopse</h3>
                  <p class="text-gray-300 leading-relaxed">
                    {{ movieDetails?.overview || 'Sinopse não disponível.' }}
                  </p>
                </div>

                <!-- Diretor -->
                <div v-if="movieDetails?.director">
                  <h3 class="text-xl font-bold mb-2">Direção</h3>
                  <p class="text-gray-300">🎬 {{ movieDetails.director }}</p>
                </div>

                <!-- Elenco -->
                <div v-if="movieDetails?.cast?.length">
                  <h3 class="text-xl font-bold mb-3">Elenco Principal</h3>
                  <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div
                      v-for="actor in movieDetails.cast"
                      :key="actor.name"
                      class="text-center"
                    >
                      <img
                        :src="getActorPhotoUrl(actor.profilePath)"
                        :alt="actor.name"
                        class="w-full aspect-[2/3] object-cover rounded mb-2"
                      />
                      <p class="font-medium text-sm">{{ actor.name }}</p>
                      <p class="text-xs text-gray-400">{{ actor.character }}</p>
                    </div>
                  </div>
                </div>

                <!-- Trailer -->
                <div v-if="movieDetails?.trailer">
                  <h3 class="text-xl font-bold mb-3">Trailer</h3>
                  <div class="aspect-video bg-black rounded overflow-hidden">
                    <iframe
                      :src="`https://www.youtube.com/embed/${movieDetails.trailer}`"
                      class="w-full h-full"
                      frameborder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen
                    ></iframe>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tab: Adicionar -->
            <div v-show="activeTab === 'add'" class="p-6">
              <form @submit.prevent="handleSubmit" class="space-y-4">
                <!-- Erro -->
                <div v-if="errorMessage" class="p-3 bg-red-500/20 border border-red-500 rounded text-red-200 text-sm">
                  {{ errorMessage }}
                </div>

                <!-- Formato -->
                <div>
                  <label class="block text-sm font-medium mb-2">Formato *</label>
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <button
                      v-for="fmt in formats"
                      :key="fmt.value"
                      type="button"
                      @click="format = fmt.value"
                      :class="[
                        'px-4 py-2 rounded-lg border transition',
                        format === fmt.value
                          ? 'bg-accent border-accent text-white'
                          : 'border-gray-600 hover:border-accent'
                      ]"
                    >
                      {{ fmt.label }}
                    </button>
                  </div>
                </div>

                <!-- Código de Barras -->
                <div>
                  <label class="block text-sm font-medium mb-2">Código de Barras (opcional)</label>
                  <input
                    v-model="barcode"
                    type="text"
                    pattern="[0-9]*"
                    class="w-full px-4 py-2 bg-primary border border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition"
                    placeholder="Ex: 7898512345678"
                  />
                  <p class="text-xs text-gray-400 mt-1">Se você tiver o código de barras da embalagem física</p>
                </div>

                <!-- Condição -->
                <div>
                  <label class="block text-sm font-medium mb-2">Condição *</label>
                  <select
                    v-model="condition"
                    class="w-full px-4 py-2 bg-primary border border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition"
                  >
                    <option v-for="cond in conditions" :key="cond.value" :value="cond.value">
                      {{ cond.label }}
                    </option>
                  </select>
                </div>

                <!-- Localização -->
                <div>
                  <label class="block text-sm font-medium mb-2">Localização (opcional)</label>
                  <input
                    v-model="location"
                    type="text"
                    class="w-full px-4 py-2 bg-primary border border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition"
                    placeholder="Ex: Estante A - Prateleira 2"
                  />
                </div>

                <!-- Preço -->
                <div>
                  <label class="block text-sm font-medium mb-2">Preço Pago (opcional)</label>
                  <input
                    v-model.number="price"
                    type="number"
                    step="0.01"
                    min="0"
                    class="w-full px-4 py-2 bg-primary border border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition"
                    placeholder="Ex: 49.90"
                  />
                </div>

                <!-- Notas -->
                <div>
                  <label class="block text-sm font-medium mb-2">Notas (opcional)</label>
                  <textarea
                    v-model="notes"
                    rows="3"
                    class="w-full px-4 py-2 bg-primary border border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition resize-none"
                    placeholder="Ex: Edição especial com extras"
                  ></textarea>
                </div>

                <!-- Botões -->
                <div class="flex gap-3 pt-4">
                  <button
                    type="button"
                    @click="handleClose"
                    class="flex-1 px-6 py-3 border border-gray-600 hover:border-gray-500 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    :disabled="isLoading"
                    class="flex-1 px-6 py-3 bg-accent hover:bg-accent/90 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {{ isLoading ? 'Adicionando...' : 'Adicionar à Coleção' }}
                  </button>
                </div>
              </form>
            </div>
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
