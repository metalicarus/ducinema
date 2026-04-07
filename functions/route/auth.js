const express = require("express");
const router = express.Router();
const { createOrUpdateUser, getUserProfile } = require("../controller/authController");
const { authenticateUser } = require("../middleware/auth");

router.post("/callback", authenticateUser, async (req, res) => {
  try {
    const { displayName } = req.body;
    
    const result = await createOrUpdateUser(
      req.userId,
      req.userEmail,
      displayName
    );
    
    return res.json({
      message: result.isNewUser ? "Usuário criado com sucesso" : "Login realizado",
      ...result
    });
    
  } catch (error) {
    console.error("Erro no callback de auth:", error.message);
    res.status(500).json({ error: "Erro interno ao processar autenticação" });
  }
});

router.get("/profile", authenticateUser, async (req, res) => {
  try {
    const profile = await getUserProfile(req.userId);
    return res.json(profile);
  } catch (error) {
    console.error("Erro ao buscar perfil:", error.message);
    const status = error.message?.toLowerCase().includes("não encontrado") ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
});

module.exports = router;