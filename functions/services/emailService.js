const { Resend } = require('resend')

let resend = null

function getResendClient() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

const FROM_EMAIL = 'Du Cinéma <noreply@ducinema.online>'

async function sendVerificationEmail(to, displayName, verificationLink) {
  try {
    const client = getResendClient()
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: to,
      subject: '🎬 Verifique seu email - Du Cinéma',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #D4AF37; text-align: center;">🎬 Du Cinéma</h1>
          <h2 style="color: #333;">Olá, ${displayName}!</h2>
          <p style="color: #555; font-size: 16px;">
            Obrigado por se cadastrar no Du Cinéma! Para ativar sua conta e começar a gerenciar sua coleção de filmes, clique no botão abaixo:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background-color: #D4AF37; color: #1a1a2e; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Verificar meu email
            </a>
          </div>
          <p style="color: #888; font-size: 14px;">
            Se você não criou uma conta no Du Cinéma, pode ignorar este email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #aaa; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} Du Cinéma - Sua coleção de filmes pessoal
          </p>
        </div>
      `
    })

    if (error) {
      console.error('Erro ao enviar email de verificação:', error)
      throw error
    }

    return data
  } catch (err) {
    console.error('Erro no serviço de email:', err)
    throw err
  }
}

async function sendPasswordResetEmail(to, displayName, resetLink) {
  try {
    const client = getResendClient()
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: to,
      subject: '🔐 Recuperar senha - Du Cinéma',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #D4AF37; text-align: center;">🎬 Du Cinéma</h1>
          <h2 style="color: #333;">Olá, ${displayName}!</h2>
          <p style="color: #555; font-size: 16px;">
            Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #D4AF37; color: #1a1a2e; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Redefinir minha senha
            </a>
          </div>
          <p style="color: #888; font-size: 14px;">
            Este link expira em 1 hora. Se você não solicitou a redefinição de senha, pode ignorar este email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #aaa; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} Du Cinéma - Sua coleção de filmes pessoal
          </p>
        </div>
      `
    })

    if (error) {
      console.error('Erro ao enviar email de recuperação:', error)
      throw error
    }

    return data
  } catch (err) {
    console.error('Erro no serviço de email:', err)
    throw err
  }
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
}