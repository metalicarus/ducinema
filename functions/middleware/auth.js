const { admin } = require("../config/firebase");

// Middleware para verificar token de autenticação
async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token de autenticação não fornecido" });
    }
    
    const token = authHeader.split("Bearer ")[1];
    
    // Verifica o token com Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Adiciona o UID do usuário na requisição
    req.userId = decodedToken.uid;
    req.userEmail = decodedToken.email;
    
    next();
  } catch (error) {
    console.error("Erro na autenticação:", error);
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

// Middleware opcional - permite acesso sem autenticação mas pega o userId se tiver
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.userId = decodedToken.uid;
      req.userEmail = decodedToken.email;
    }
    
    next();
  } catch (error) {
    // Ignora erros e continua sem autenticação
    next();
  }
}

module.exports = {
  authenticateUser,
  optionalAuth
};