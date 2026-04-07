import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { auth } from '@/config/firebase'

const API_URL = 'https://api-p7h2itfhbq-uc.a.run.app'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(true)
  const error = ref(null)

  const isAuthenticated = computed(() => !!user.value)
  const isEmailVerified = computed(() => user.value?.emailVerified ?? false)

  function initAuth() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        user.value = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          emailVerified: firebaseUser.emailVerified
        }

        try {
          const token = await firebaseUser.getIdToken()
          await fetch(`${API_URL}/auth/callback`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0]
            })
          })
        } catch (err) {
          console.error('Erro no callback:', err)
        }
      } else {
        user.value = null
      }
      loading.value = false
    })
  }

  async function loginWithEmail(email, password) {
    try {
      error.value = null
      loading.value = true
      const userCredential = await signInWithEmailAndPassword(auth, email, password)

      if (!userCredential.user.emailVerified) {
        return { needsVerification: true }
      }

      return { needsVerification: false }
    } catch (err) {
      error.value = getErrorMessage(err.code)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function registerWithEmail(email, password, displayName) {
    try {
      error.value = null
      loading.value = true
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      if (displayName) {
        await updateProfile(userCredential.user, { displayName })
      }

      // Envia email de verificação via Resend
      await fetch(`${API_URL}/email/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          displayName: displayName || email.split('@')[0]
        })
      })

      return { verificationSent: true }
    } catch (err) {
      error.value = getErrorMessage(err.code)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function loginWithGoogle() {
    try {
      error.value = null
      loading.value = true
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (err) {
      error.value = getErrorMessage(err.code)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Recuperar senha via Resend
  async function resetPassword(email) {
    try {
      error.value = null
      loading.value = true

      const response = await fetch(`${API_URL}/email/send-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (!response.ok) {
        throw new Error('Erro ao enviar email')
      }
    } catch (err) {
      error.value = 'Erro ao enviar email de recuperação'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Reenviar email de verificação via Resend
  async function resendVerificationEmail() {
    try {
      error.value = null

      if (!user.value?.email) return

      await fetch(`${API_URL}/email/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.value.email,
          displayName: user.value.displayName || user.value.email.split('@')[0]
        })
      })
    } catch (err) {
      error.value = 'Erro ao reenviar email'
      throw err
    }
  }

  async function reloadUser() {
    if (auth.currentUser) {
      await auth.currentUser.reload()
      user.value = {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName,
        emailVerified: auth.currentUser.emailVerified
      }
    }
  }

  async function logout() {
    try {
      await signOut(auth)
      user.value = null
    } catch (err) {
      error.value = 'Erro ao fazer logout'
      throw err
    }
  }

  async function getToken() {
    if (!auth.currentUser) return null
    return await auth.currentUser.getIdToken()
  }

  function getErrorMessage(code) {
    const messages = {
      'auth/user-not-found': 'Usuário não encontrado',
      'auth/wrong-password': 'Senha incorreta',
      'auth/email-already-in-use': 'Email já está em uso',
      'auth/weak-password': 'Senha muito fraca (mínimo 6 caracteres)',
      'auth/invalid-email': 'Email inválido',
      'auth/invalid-credential': 'Email ou senha incorretos',
      'auth/popup-closed-by-user': 'Login cancelado',
      'auth/network-request-failed': 'Erro de conexão',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde'
    }
    return messages[code] || 'Erro ao autenticar'
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    isEmailVerified,
    initAuth,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    resetPassword,
    resendVerificationEmail,
    reloadUser,
    logout,
    getToken
  }
})
