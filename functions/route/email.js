const express = require('express')
const router = express.Router()
const admin = require('firebase-admin')
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService')

const ACTION_CODE_SETTINGS = {
  url: 'https://ducinema.online/login',
  handleCodeInApp: false
}

// Enviar email de verificação
router.post('/send-verification', async (req, res) => {
  try {
    const { email, displayName } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' })
    }

    // Gera o link de verificação via Firebase
    const verificationLink = await admin.auth().generateEmailVerificationLink(email, ACTION_CODE_SETTINGS)

    // Envia via Resend
    await sendVerificationEmail(email, displayName || 'Colecionador', verificationLink)

    res.json({ success: true, message: 'Email de verificação enviado' })
  } catch (err) {
    console.error('Erro ao enviar verificação:', err)
    res.status(500).json({ error: 'Erro ao enviar email de verificação' })
  }
})

// Enviar email de recuperação de senha
router.post('/send-password-reset', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' })
    }

    // Busca o usuário para pegar o nome
    let displayName = 'Colecionador'
    try {
      const user = await admin.auth().getUserByEmail(email)
      displayName = user.displayName || email.split('@')[0]
    } catch (e) {
      // Usuário não existe, mas não informamos isso por segurança
      return res.json({ success: true, message: 'Se o email existir, você receberá as instruções' })
    }

    // Gera o link de recuperação via Firebase
    const resetLink = await admin.auth().generatePasswordResetLink(email, ACTION_CODE_SETTINGS)

    // Envia via Resend
    await sendPasswordResetEmail(email, displayName, resetLink)

    res.json({ success: true, message: 'Email de recuperação enviado' })
  } catch (err) {
    console.error('Erro ao enviar recuperação:', err)
    res.status(500).json({ error: 'Erro ao enviar email de recuperação' })
  }
})

module.exports = router