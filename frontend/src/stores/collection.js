import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

const API_URL = 'https://api-p7h2itfhbq-uc.a.run.app'

export const useCollectionStore = defineStore('collection', () => {
  const items = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Buscar coleção do usuário
  async function fetchCollection(format = null) {
    try {
      loading.value = true
      error.value = null

      const authStore = useAuthStore()
      const token = await authStore.getToken()

      let url = `${API_URL}/collection`
      if (format) {
        url += `?format=${format}`
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar coleção')
      }

      const data = await response.json()
      items.value = data.items || []

      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Adicionar filme à coleção
  async function addToCollection(releaseId, itemData) {
    try {
      loading.value = true
      error.value = null

      const authStore = useAuthStore()
      const token = await authStore.getToken()

      const response = await fetch(`${API_URL}/collection/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          releaseId,
          ...itemData
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao adicionar à coleção')
      }

      const data = await response.json()

      // Atualiza a lista local
      await fetchCollection()

      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Remover da coleção
  async function removeFromCollection(itemId) {
    try {
      loading.value = true
      error.value = null

      const authStore = useAuthStore()
      const token = await authStore.getToken()

      const response = await fetch(`${API_URL}/collection/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao remover da coleção')
      }

      // Remove da lista local
      items.value = items.value.filter(item => item.id !== itemId)

      return true
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

// Atualizar informações do item na coleção
async function updateCollectionItem(itemId, updates) {
  try {
    loading.value = true
    error.value = null

    const authStore = useAuthStore()
    const token = await authStore.getToken()

    const response = await fetch(`${API_URL}/collection/${itemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      throw new Error('Erro ao atualizar item')
    }

    // Atualiza a lista local
    await fetchCollection()

    return true
  } catch (err) {
    error.value = err.message
    throw err
  } finally {
    loading.value = false
  }
}

  return {
    items,
    loading,
    error,
    fetchCollection,
    addToCollection,
    removeFromCollection,
    updateCollectionItem
  }
})
