<script setup>
import { ref, computed, watch } from 'vue'
import { useCollectionStore } from '@/stores/collection'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'updated', 'error'])

const API_URL = 'https://api-p7h2itfhbq-uc.a.run.app'
const collectionStore = useCollectionStore()

const movieDetails = ref(null)
const loadingDetails = ref(false)
const isEditing = ref(false)
const isSaving = ref(false)
const editingCopyId = ref(null)

// Todas as cópias deste filme
const allCopies = ref([])

// Form fields para edição
const editForm = ref({
  condition: '',
  location: '',
  price: null,
  notes: ''
})

const conditions = [
  { value: 'novo', label: 'Novo/Lacrado' },
  { value: 'usado', label: 'Usado' },
  { value: 'danificado', label: 'Danificado' }
]

const posterUrl = computed(() => {
  const movie = movieDetails.value || props.item.movie
  if (!movie?.posterPath) return 'https://via.placeholder.com/300x450?text=Sem+Poster'
  return `https://image.tmdb.org/t/p/w500${movie.posterPath}`
})

const backdropUrl = computed(() => {
  if (!movieDetails.value?.backdropPath) return null
  return `https://image.tmdb.org/t/p/w1280${movieDetails.value.backdropPath}`
})

// Buscar detalhes quando o modal abre
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    if (!movieDetails.value) {
      fetchMovieDetails()
    }
    await fetchAllCopies()
    isEditing.value = false
    editingCopyId.value = null
  }
})

async function fetchMovieDetails() {
  try {
    loadingDetails.value = true
    
    const response = await fetch(`${API_URL}/movies/details/${props.item.movie.tmdbId}`)
    
    if (!response.ok) {
      throw new Error('Erro ao buscar detalhes')
    }
    
    const data = await response.json()
    movieDetails.value = data
    
  } catch (err) {
    console.error('Erro ao buscar detalhes:', err)
    movieDetails.value = {
      ...props.item.movie,
      overview: 'Sinopse não disponível.',
      director: null,
      cast: [],
      runtime: 0,
      voteAverage: 0,
      trailer: null
    }
  } finally {
    loadingDetails.value = false
  }
}

async function fetchAllCopies() {
  try {
    const tmdbId = props.item.movie.tmdbId
    allCopies.value = collectionStore.items.filter(
      item => item.movie?.tmdbId === tmdbId
    )
  } catch (err) {
    console.error('Erro ao buscar cópias:', err)
  }
}

function startEditing(copy) {
  editingCopyId.value = copy.id
  isEditing.value = true
  editForm.value = {
    condition: copy.condition || 'usado',
    location: copy.location || '',
    price: copy.price || null,
    notes: copy.notes || ''
  }
}

function cancelEditing() {
  isEditing.value = false
  editingCopyId.value = null
}

async function saveChanges() {
  try {
    isSaving.value = true
    
    await collectionStore.updateCollectionItem(editingCopyId.value, editForm.value)
    
    isEditing.value = false
    editingCopyId.value = null
    
    // Recarregar cópias
    await fetchAllCopies()
    
    emit('updated')
    
  } catch (err) {
    emit('error', err.message)
  } finally {
    isSaving.value = false
  }
}

async function handleRemoveCopy(copyId) {
  emit('remove-copy', copyId)
}

function handleClose() {
  movieDetails.value = null
  isEditing.value = false
  editingCopyId.value = null
  allCopies.value = []
  emit('close')
}

function getActorPhotoUrl(profilePath) {
  if (!profilePath) return 'https://via.placeholder.com/100x150?text=N/A'
  return `https://image.tmdb.org/t/p/w185${profilePath}`
}

function getFormatLabel(format) {
  const labels = {
    'bluray': 'Blu-ray',
    'dvd': 'DVD',
    'vhs': 'VHS',
    '4k': '4K Ultra HD',
    'outros': 'Outros'
  }
  return labels[format] || format
}

function getConditionLabel(condition) {
  const labels = {
    'novo': 'Novo/Lacrado',
    'usado': 'Usado',
    'danificado': 'Danificado'
  }
  return labels[condition] || condition
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
          <div class="relative h-32 md:h-48 bg-gray-800 flex-shrink-0">
            <img 
              v-if="backdropUrl"
              :src="backdropUrl" 
              :alt="item.movie.title"
              class="w-full h-full object-cover opacity-50"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-secondary to-transparent"></div>
            
            <div class="absolute bottom-0 left-0 right-0 p-4 md:p-6 flex items-end gap-3 md:gap-4">
              <img 
                :src="posterUrl" 
                :alt="item.movie.title"
                class="w-16 h-24 md:w-24 md:h-36 object-cover rounded shadow-2xl flex-shrink-0"
              />
              <div class="flex-1 min-w-0">
                <h2 class="text-xl md:text-3xl font-bold mb-1 truncate">{{ item.movie.title }}</h2>
                <p class="text-gray-300 text-xs md:text-sm truncate">{{ item.movie.originalTitle }}</p>
                <div class="flex gap-2 md:gap-4 text-xs md:text-sm text-gray-300 mt-1 md:mt-2">
                  <span>{{ item.movie.year }}</span>
                  <span v-if="movieDetails?.runtime">{{ movieDetails.runtime }} min</span>
                  <span v-if="movieDetails?.voteAverage" class="flex items-center gap-1">
                    ⭐ {{ movieDetails.voteAverage.toFixed(1) }}
                  </span>
                </div>
              </div>
              <button 
                @click="handleClose"
                class="text-gray-400 hover:text-white text-2xl md:text-3xl flex-shrink-0"
              >
                ×
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-4 md:p-6 space-y-6">
              <!-- Loading -->
              <div v-if="loadingDetails" class="text-center py-8 text-gray-400">
                <div class="inline-block mb-4">
                  <div class="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p>Carregando detalhes...</p>
              </div>

              <div v-else>
                <!-- Informações da Coleção - TODAS AS CÓPIAS -->
                <div class="bg-primary rounded-lg p-4 mb-6">
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="text-lg font-bold flex items-center gap-2">
                      📀 Minhas Cópias
                      <span v-if="allCopies.length > 1" class="text-sm text-gold">({{ allCopies.length }})</span>
                    </h3>
                  </div>

                  <!-- Lista de todas as cópias -->
                  <div class="space-y-4">
                    <div
                      v-for="(copy, index) in allCopies"
                      :key="copy.id"
                      class="bg-secondary rounded-lg p-4"
                    >
                      <!-- Modo Visualização -->
                      <div v-if="editingCopyId !== copy.id">
                        <div class="flex items-center justify-between mb-2">
                          <h4 class="font-bold text-accent">
                            {{ getFormatLabel(copy.release?.format) }}
                            <span v-if="index === 0 && allCopies.length > 1" class="text-xs text-gray-500 ml-2">(principal)</span>
                          </h4>
                          <div class="flex gap-2">
                            <button
                              @click="startEditing(copy)"
                              class="px-3 py-1 bg-accent hover:bg-accent/90 rounded text-xs font-medium"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              @click="handleRemoveCopy(copy.id)"
                              class="text-red-500 hover:text-red-400 text-sm"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                        
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span class="text-gray-400 block">Condição</span>
                            <span class="font-medium">{{ getConditionLabel(copy.condition) }}</span>
                          </div>
                          <div v-if="copy.location">
                            <span class="text-gray-400 block">Localização</span>
                            <span class="font-medium">{{ copy.location }}</span>
                          </div>
                          <div v-if="copy.price">
                            <span class="text-gray-400 block">Preço Pago</span>
                            <span class="font-medium">R$ {{ copy.price.toFixed(2) }}</span>
                          </div>
                        </div>
                        
                        <div v-if="copy.release?.barcode" class="mt-2 text-xs text-gray-500">
                          Código de barras: {{ copy.release.barcode }}
                        </div>
                        <div v-if="copy.notes" class="mt-2 text-sm">
                          <span class="text-gray-400 block mb-1">Notas</span>
                          <p class="text-gray-300">{{ copy.notes }}</p>
                        </div>
                      </div>

                      <!-- Modo Edição -->
                      <div v-else class="space-y-4">
                        <div class="flex items-center justify-between mb-2">
                          <h4 class="font-bold text-accent">
                            Editando: {{ getFormatLabel(copy.release?.format) }}
                          </h4>
                        </div>

                        <!-- Condição -->
                        <div>
                          <label class="text-gray-400 block text-sm mb-1">Condição</label>
                          <select
                            v-model="editForm.condition"
                            class="w-full px-4 py-2 bg-primary border border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition text-sm"
                          >
                            <option v-for="cond in conditions" :key="cond.value" :value="cond.value">
                              {{ cond.label }}
                            </option>
                          </select>
                        </div>

                        <!-- Localização -->
                        <div>
                          <label class="text-gray-400 block text-sm mb-1">Localização</label>
                          <input
                            v-model="editForm.location"
                            type="text"
                            class="w-full px-4 py-2 bg-primary border border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition text-sm"
                            placeholder="Ex: Estante A - Prateleira 2"
                          />
                        </div>

                        <!-- Preço -->
                        <div>
                          <label class="text-gray-400 block text-sm mb-1">Preço Pago</label>
                          <input
                            v-model.number="editForm.price"
                            type="number"
                            step="0.01"
                            min="0"
                            class="w-full px-4 py-2 bg-primary border border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition text-sm"
                            placeholder="Ex: 49.90"
                          />
                        </div>

                        <!-- Notas -->
                        <div>
                          <label class="text-gray-400 block text-sm mb-1">Notas</label>
                          <textarea
                            v-model="editForm.notes"
                            rows="3"
                            class="w-full px-4 py-2 bg-primary border border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition resize-none text-sm"
                            placeholder="Ex: Edição especial com extras"
                          ></textarea>
                        </div>

                        <!-- Botões -->
                        <div class="flex gap-3 pt-2">
                          <button
                            @click="cancelEditing"
                            :disabled="isSaving"
                            class="flex-1 px-4 py-2 border border-gray-600 hover:border-gray-500 rounded-lg transition disabled:opacity-50 text-sm"
                          >
                            Cancelar
                          </button>
                          <button
                            @click="saveChanges"
                            :disabled="isSaving"
                            class="flex-1 px-4 py-2 bg-accent hover:bg-accent/90 rounded-lg transition disabled:opacity-50 font-medium text-sm"
                          >
                            {{ isSaving ? 'Salvando...' : 'Salvar' }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Gêneros -->
                <div v-if="movieDetails?.genres?.length">
                  <div class="flex gap-2 flex-wrap mb-4">
                    <span
                      v-for="genre in movieDetails.genres"
                      :key="genre"
                      class="px-3 py-1 bg-primary rounded-full text-xs md:text-sm"
                    >
                      {{ genre }}
                    </span>
                  </div>
                </div>

                <!-- Sinopse -->
                <div>
                  <h3 class="text-lg md:text-xl font-bold mb-2">Sinopse</h3>
                  <p class="text-sm md:text-base text-gray-300 leading-relaxed">
                    {{ movieDetails?.overview || 'Sinopse não disponível.' }}
                  </p>
                </div>

                <!-- Diretor -->
                <div v-if="movieDetails?.director">
                  <h3 class="text-lg md:text-xl font-bold mb-2">Direção</h3>
                  <p class="text-sm md:text-base text-gray-300">🎬 {{ movieDetails.director }}</p>
                </div>

                <!-- Elenco -->
                <div v-if="movieDetails?.cast?.length">
                  <h3 class="text-lg md:text-xl font-bold mb-3">Elenco Principal</h3>
                  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
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
                      <p class="font-medium text-xs md:text-sm">{{ actor.name }}</p>
                      <p class="text-xs text-gray-400">{{ actor.character }}</p>
                    </div>
                  </div>
                </div>

                <!-- Trailer -->
                <div v-if="movieDetails?.trailer">
                  <h3 class="text-lg md:text-xl font-bold mb-3">Trailer</h3>
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
