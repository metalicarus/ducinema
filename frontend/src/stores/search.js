import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

const API_URL = 'https://api-p7h2itfhbq-uc.a.run.app'

export const useSearchStore = defineStore('search', () => {
  const results = ref([])
  const loading = ref(false)
  const error = ref(null)
  const currentPage = ref(1)
  const totalPages = ref(1)
  const totalResults = ref(0)
  const lastQuery = ref('')

  // Buscar filmes (por título ou código de barras)
  async function search(query, page = 1) {
    try {
      loading.value = true
      error.value = null
      lastQuery.value = query
      currentPage.value = page

      const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}&page=${page}`)

      if (!response.ok) {
        throw new Error('Erro na busca')
      }

      const data = await response.json()

      // Se encontrou um release específico (código de barras)
      if (data.type === 'release') {
        results.value = [data]
        totalPages.value = 1
        totalResults.value = 1
      } else if (data.type === 'movies') {
        results.value = data.results || []
        totalPages.value = data.totalPages || 1
        totalResults.value = data.totalResults || data.count || 0
      } else {
        results.value = []
        totalPages.value = 1
        totalResults.value = 0
      }

      return data
    } catch (err) {
      error.value = err.message
      results.value = []
      throw err
    } finally {
      loading.value = false
    }
  }

  // Próxima página
  async function nextPage() {
    if (currentPage.value < totalPages.value) {
      await search(lastQuery.value, currentPage.value + 1)
    }
  }

  // Página anterior
  async function previousPage() {
    if (currentPage.value > 1) {
      await search(lastQuery.value, currentPage.value - 1)
    }
  }

  // Ir para página específica
  async function goToPage(page) {
    if (page >= 1 && page <= totalPages.value) {
      await search(lastQuery.value, page)
    }
  }

  // Adicionar filme do TMDB (cria o filme + release)
  async function addMovieFromTMDB(tmdbId, format, barcode = null) {
    try {
      loading.value = true
      error.value = null

      const authStore = useAuthStore()
      const token = await authStore.getToken()

      const response = await fetch(`${API_URL}/movies/add-from-tmdb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tmdbId,
          format,
          barcode
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao adicionar filme')
      }

      const data = await response.json()
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearResults() {
    results.value = []
    error.value = null
    currentPage.value = 1
    totalPages.value = 1
    totalResults.value = 0
    lastQuery.value = ''
  }

  return {
    results,
    loading,
    error,
    currentPage,
    totalPages,
    totalResults,
    lastQuery,
    search,
    nextPage,
    previousPage,
    goToPage,
    addMovieFromTMDB,
    clearResults
  }
})
