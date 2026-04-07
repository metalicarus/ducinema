<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const localError = ref('')
const successMessage = ref('')
const isLoading = ref(false)
const emailSent = ref(false)

async function handleSubmit() {
  try {
    localError.value = ''
    successMessage.value = ''
    isLoading.value = true

    await authStore.resetPassword(email.value)

    emailSent.value = true
    successMessage.value = `Enviamos um email para ${email.value} com instruções para redefinir sua senha.`
  } catch (err) {
    localError.value = authStore.error || 'Erro ao enviar email de recuperação'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-primary px-4">
    <div class="max-w-md w-full">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <h1 class="text-5xl font-bold text-gold mb-2">🎬 Du Cinéma</h1>
        <p class="text-gray-400">Recuperar senha</p>
      </div>

      <!-- Card -->
      <div class="bg-secondary rounded-lg shadow-2xl p-8">
        <h2 class="text-2xl font-bold mb-2 text-center">Esqueceu sua senha?</h2>
        <p class="text-gray-400 text-center mb-6 text-sm">
          Digite seu email e enviaremos instruções para criar uma nova senha.
        </p>

        <!-- Mensagem de Sucesso -->
        <div v-if="successMessage" class="mb-4 p-4 bg-green-500/20 border border-green-500 rounded text-green-200 text-sm">
          <div class="flex items-start gap-2">
            <span class="text-xl">✉️</span>
            <div>
              <p class="font-medium">Email enviado!</p>
              <p class="mt-1">{{ successMessage }}</p>
            </div>
          </div>
        </div>

        <!-- Erro -->
        <div v-if="localError" class="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-200 text-sm">
          {{ localError }}
        </div>

        <!-- Formulário -->
        <form v-if="!emailSent" @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Email -->
          <div>
            <label class="block text-sm font-medium mb-2">Email</label>
            <input
              v-model="email"
              type="email"
              required
              class="w-full px-4 py-2 bg-primary border border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition"
              placeholder="seu@email.com"
            />
          </div>

          <!-- Botão Submit -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-accent hover:bg-accent/90 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'Enviando...' : 'Enviar email de recuperação' }}
          </button>
        </form>

        <!-- Botão após envio -->
        <div v-else class="space-y-4">
          <button
            @click="emailSent = false; email = ''"
            class="w-full bg-secondary border border-gray-600 hover:border-accent text-white font-medium py-3 rounded-lg transition"
          >
            Enviar para outro email
          </button>
        </div>

        <!-- Voltar para login -->
        <div class="mt-6 text-center">
          <router-link
            to="/login"
            class="text-accent hover:text-accent/80 text-sm flex items-center justify-center gap-2"
          >
            ← Voltar para o login
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
