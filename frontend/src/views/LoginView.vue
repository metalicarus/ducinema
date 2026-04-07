<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const displayName = ref('')
const localError = ref('')
const successMessage = ref('')
const isLoading = ref(false)
const needsVerification = ref(false)

async function handleSubmit() {
  try {
    localError.value = ''
    successMessage.value = ''
    isLoading.value = true

    if (isLogin.value) {
      const result = await authStore.loginWithEmail(email.value, password.value)

      if (result.needsVerification) {
        needsVerification.value = true
        localError.value = 'Verifique seu email antes de continuar. Cheque sua caixa de entrada.'
        return
      }

      router.push('/')
    } else {
      const result = await authStore.registerWithEmail(email.value, password.value, displayName.value)

      if (result.verificationSent) {
        successMessage.value = 'Conta criada! Enviamos um email de verificação. Cheque sua caixa de entrada e clique no link para ativar sua conta.'
        needsVerification.value = true
        isLogin.value = true
        password.value = ''
      }
    }
  } catch (err) {
    localError.value = authStore.error || 'Erro ao autenticar'
  } finally {
    isLoading.value = false
  }
}

async function handleGoogleLogin() {
  try {
    localError.value = ''
    successMessage.value = ''
    isLoading.value = true
    await authStore.loginWithGoogle()
    router.push('/')
  } catch (err) {
    localError.value = authStore.error || 'Erro ao fazer login com Google'
  } finally {
    isLoading.value = false
  }
}

async function handleResendVerification() {
  try {
    isLoading.value = true
    await authStore.resendVerificationEmail()
    successMessage.value = 'Email de verificação reenviado! Cheque sua caixa de entrada.'
    localError.value = ''
  } catch (err) {
    localError.value = authStore.error || 'Erro ao reenviar email'
  } finally {
    isLoading.value = false
  }
}

function toggleMode() {
  isLogin.value = !isLogin.value
  localError.value = ''
  successMessage.value = ''
  needsVerification.value = false
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-primary px-4">
    <div class="max-w-md w-full">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <h1 class="text-5xl font-bold text-gold mb-2">🎬 Du Cinéma</h1>
        <p class="text-gray-400">Sua coleção de filmes pessoal</p>
      </div>

      <!-- Card -->
      <div class="bg-secondary rounded-lg shadow-2xl p-8">
        <h2 class="text-2xl font-bold mb-6 text-center">
          {{ isLogin ? 'Entrar' : 'Criar Conta' }}
        </h2>

        <!-- Mensagem de Sucesso -->
        <div v-if="successMessage" class="mb-4 p-3 bg-green-500/20 border border-green-500 rounded text-green-200 text-sm">
          {{ successMessage }}
        </div>

        <!-- Erro -->
        <div v-if="localError" class="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-200 text-sm">
          {{ localError }}
          <button
            v-if="needsVerification && isLogin"
            @click="handleResendVerification"
            :disabled="isLoading"
            class="block mt-2 text-accent hover:text-accent/80 underline"
          >
            Reenviar email de verificação
          </button>
        </div>

        <!-- Formulário -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Nome (apenas no registro) -->
          <div v-if="!isLogin">
            <label class="block text-sm font-medium mb-2">Nome</label>
            <input
              v-model="displayName"
              type="text"
              required
              class="w-full px-4 py-2 bg-primary border border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition"
              placeholder="Seu nome"
            />
          </div>

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

          <!-- Senha -->
          <div>
            <label class="block text-sm font-medium mb-2">Senha</label>
            <input
              v-model="password"
              type="password"
              required
              minlength="6"
              class="w-full px-4 py-2 bg-primary border border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <!-- Link Esqueci Senha -->
          <div v-if="isLogin" class="text-right">
            <router-link
              to="/forgot-password"
              class="text-sm text-accent hover:text-accent/80"
            >
              Esqueci minha senha
            </router-link>
          </div>

          <!-- Botão Submit -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-accent hover:bg-accent/90 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Criar Conta') }}
          </button>
        </form>

        <!-- Divider -->
        <div class="my-6 flex items-center">
          <div class="flex-1 border-t border-gray-600"></div>
          <span class="px-4 text-sm text-gray-400">ou</span>
          <div class="flex-1 border-t border-gray-600"></div>
        </div>

        <!-- Login com Google -->
        <button
          @click="handleGoogleLogin"
          :disabled="isLoading"
          class="w-full bg-white hover:bg-gray-100 text-gray-800 font-medium py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar com Google
        </button>

        <!-- Toggle Login/Registro -->
        <div class="mt-6 text-center text-sm">
          <span class="text-gray-400">
            {{ isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?' }}
          </span>
          <button
            @click="toggleMode"
            class="ml-2 text-accent hover:text-accent/80 font-medium"
          >
            {{ isLogin ? 'Criar conta' : 'Fazer login' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
