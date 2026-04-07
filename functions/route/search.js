const express = require("express");
const router = express.Router();
const { isBarcode } = require("../utils/helper");
const { searchByBarcode, searchLocalMovies, searchTMDB } = require("../controller/searchController");

// Endpoint unificado de pesquisa
router.get("/", async (req, res) => {
  try {
    const { q, page } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: "Parâmetro 'q' é obrigatório" });
    }

    const pageNum = parseInt(page) || 1;

    // 1) Pesquisa por código de barras
    if (isBarcode(q)) {
      const result = await searchByBarcode(q);
      
      if (!result) {
        return res.status(404).json({ 
          error: "Release não encontrado",
          searched: q,
          type: "barcode"
        });
      }
      
      return res.json(result);
    }
    
    // 2) Pesquisa por título no banco local (somente página 1)
    if (pageNum === 1) {
      let result = await searchLocalMovies(q);
      if (result) {
        return res.json(result);
      }
    }
    
    // 3) Pesquisa no TMDB com paginação
    const result = await searchTMDB(q, pageNum);
    if (result) {
      return res.json(result);
    }
    
    // Nada encontrado
    return res.status(404).json({
      error: "Nenhum filme encontrado",
      searched: q,
      type: "title",
      noResults: true
    });
    
  } catch (error) {
    console.error("Erro na pesquisa:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;