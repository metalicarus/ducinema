const express = require("express");
const router = express.Router();
const { createOrUpdateUser, getUserProfile } = require("../controller/authController");
const { authenticateUser } = require("../middleware/auth");

// Callback após login bem-sucedido (chamado pelo frontend)
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
    console.error("Erro no callback de auth:", error);
    res.status(500).json({ error: error.message });
  }
});

// Obter perfil do usuário autenticado
router.get("/profile", authenticateUser, async (req, res) => {
  try {
    const profile = await getUserProfile(req.userId);
    return res.json(profile);
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    res.status(404).json({ error: error.message });
  }
});

module.exports = router;