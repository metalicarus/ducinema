const { admin } = require("../config/firebase");

async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token de autenticação não fornecido" });
    }
    const token = authHeader.slice(7);
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.userId = decodedToken.uid;
    req.userEmail = decodedToken.email;
    next();
  } catch (error) {
    console.error("Erro na autenticação:", error.message);
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.userId = decodedToken.uid;
      req.userEmail = decodedToken.email;
    }
    next();
  } catch (error) {
    console.debug("optionalAuth: token inválido, continuando sem autenticação:", error.message);
    next();
  }
}

module.exports = {
  authenticateUser,
  optionalAuth
};