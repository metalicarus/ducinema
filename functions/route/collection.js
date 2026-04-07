const express = require("express");
const router = express.Router();
const {
  addToCollection,
  getUserCollection,
  removeFromCollection,
  updateCollectionItem
} = require("../controller/collectionController");
const { authenticateUser } = require("../middleware/auth");

router.get("/public/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { format } = req.query;
    
    const filters = {};
    if (format) {
      filters.format = format;
    }
    
    // Usa a mesma função mas sem autenticação
    const collection = await getUserCollection(userId, filters);
    
    return res.json({
      userId: userId,
      total: collection.length,
      items: collection
    });
    
  } catch (error) {
    console.error("Erro ao listar coleção pública:", error);
    res.status(500).json({ error: error.message });
  }
});

// TODAS as rotas agora requerem autenticação
router.use(authenticateUser);

// Adicionar release à coleção
router.post("/add", async (req, res) => {
  try {
    const { releaseId, condition, location, purchaseDate, price, notes } = req.body;
    
    if (!releaseId) {
      return res.status(400).json({ error: "releaseId é obrigatório" });
    }
    
    // Usa o userId do token (req.userId)
    const result = await addToCollection(req.userId, releaseId, {
      condition,
      location,
      purchaseDate,
      price,
      notes
    });
    
    return res.status(201).json({
      message: "Filme adicionado à sua coleção",
      item: result
    });
    
  } catch (error) {
    console.error("Erro ao adicionar à coleção:", error);
    
    if (error.message.includes("Release não encontrado")) {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes("já possui este release")) {
      return res.status(409).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Listar coleção do usuário autenticado
router.get("/", async (req, res) => {
  try {
    const { format } = req.query;
    
    const filters = {};
    if (format) {
      filters.format = format;
    }
    
    // Usa o userId do token
    const collection = await getUserCollection(req.userId, filters);
    
    return res.json({
      userId: req.userId,
      total: collection.length,
      items: collection
    });
    
  } catch (error) {
    console.error("Erro ao listar coleção:", error);
    res.status(500).json({ error: error.message });
  }
});

// Remover item da coleção
router.delete("/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params;
    
    // Usa o userId do token
    const result = await removeFromCollection(itemId, req.userId);
    
    return res.json(result);
    
  } catch (error) {
    console.error("Erro ao remover da coleção:", error);
    
    if (error.message.includes("não encontrado")) {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes("não tem permissão")) {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Atualizar informações do item
router.patch("/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params;
    const updates = req.body;
    
    // Usa o userId do token
    const result = await updateCollectionItem(itemId, req.userId, updates);
    
    return res.json({
      message: "Item atualizado com sucesso",
      item: result
    });
    
  } catch (error) {
    console.error("Erro ao atualizar item:", error);
    
    if (error.message.includes("não encontrado")) {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes("não tem permissão")) {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;