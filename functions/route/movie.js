const express = require("express");
const router = express.Router();
const { addMovieFromTMDB } = require("../controller/movieController");
const tmdbConfig = require("../config/tmdb");
const fetch = require("node-fetch");  

// Adicionar filme do TMDB ao banco
router.post("/add-from-tmdb", async (req, res) => {
  try {
    const { tmdbId, format, barcode } = req.body;
    
    if (!tmdbId) {
      return res.status(400).json({ error: "tmdbId é obrigatório" });
    }
    
    if (!format) {
      return res.status(400).json({ error: "format é obrigatório (vhs, dvd, bluray, 4k, outros)" });
    }
    
    const result = await addMovieFromTMDB(tmdbId, format, barcode);
    
    return res.status(result.isNew ? 201 : 200).json(result);
    
  } catch (error) {
    console.error("Erro ao adicionar filme:", error);
    
    if (error.message.includes("TMDB API error")) {
      return res.status(404).json({ error: "Filme não encontrado no TMDB" });
    }
    
    if (error.message.includes("Formato inválido")) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// NOVO: Buscar detalhes completos de um filme do TMDB
router.get("/details/:tmdbId", async (req, res) => {
  try {
    const { tmdbId } = req.params;
    
    const url = `${tmdbConfig.baseUrl}/movie/${tmdbId}?api_key=${tmdbConfig.apiKey}&language=${tmdbConfig.language}&append_to_response=credits,videos`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }
    
    const movie = await response.json();
    
    // Extrai o diretor
    const director = movie.credits?.crew?.find(person => person.job === "Director")?.name || null;
    
    // Extrai principais atores (top 10)
    const cast = movie.credits?.cast?.slice(0, 10).map(actor => ({
      name: actor.name,
      character: actor.character,
      profilePath: actor.profile_path
    })) || [];
    
    // Extrai trailer do YouTube
    const trailer = movie.videos?.results?.find(
      video => video.type === "Trailer" && video.site === "YouTube"
    )?.key || null;
    
    const details = {
      tmdbId: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      overview: movie.overview,
      director: director,
      cast: cast,
      trailer: trailer,
      runtime: movie.runtime,
      genres: movie.genres?.map(g => g.name) || [],
      voteAverage: movie.vote_average,
      releaseDate: movie.release_date
    };
    
    return res.json(details);
    
  } catch (error) {
    console.error("Erro ao buscar detalhes:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;