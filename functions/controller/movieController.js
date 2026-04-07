const { db } = require("../config/firebase");
const tmdbConfig = require("../config/tmdb");
const fetch = require("node-fetch");

// Buscar detalhes completos de um filme no TMDB
async function getTMDBMovieDetails(tmdbId) {
  const url = `${tmdbConfig.baseUrl}/movie/${tmdbId}?api_key=${tmdbConfig.apiKey}&language=${tmdbConfig.language}&append_to_response=credits,videos`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }
  
  const movie = await response.json();
  
  // Extrai o diretor dos créditos
  const director = movie.credits?.crew?.find(person => person.job === "Director")?.name || null;
  
  // Extrai principais atores (top 10)
  const cast = movie.credits?.cast?.slice(0, 10).map(actor => ({
    name: actor.name,
    character: actor.character,
    profilePath: actor.profile_path
  })) || [];
  
  // Extrai trailer do YouTube (se existir)
  const trailer = movie.videos?.results?.find(
    video => video.type === "Trailer" && video.site === "YouTube"
  )?.key || null;
  
  return {
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
}

// Adicionar filme do TMDB ao banco
async function addMovieFromTMDB(tmdbId, format, barcode = null) {
  // Valida formato
  const validFormats = ["vhs", "dvd", "bluray", "4k", "outros"];
  if (!validFormats.includes(format.toLowerCase())) {
    throw new Error(`Formato inválido. Use: ${validFormats.join(", ")}`);
  }
  
  // Se tem código de barras, verifica se já existe
  if (barcode) {
    const existingRelease = await db.collection("movie_releases")
      .where("barcode", "==", barcode)
      .get();
    
    if (!existingRelease.empty) {
      // Release com este código já existe
      const releaseDoc = existingRelease.docs[0];
      const releaseData = releaseDoc.data();
      
      // Busca o filme associado
      const movieDoc = await db.collection("movies").doc(releaseData.movieId).get();
      
      return {
        movie: { id: movieDoc.id, ...movieDoc.data() },
        release: { id: releaseDoc.id, ...releaseData },
        isNew: false,
        message: "Release com este código de barras já existe"
      };
    }
  }
  
  // Verifica se o filme já existe no banco
  const existingMovie = await db.collection("movies")
    .where("tmdbId", "==", parseInt(tmdbId))
    .get();
  
  let movieRef;
  let movieData;
  let movieIsNew = false;
  
  if (!existingMovie.empty) {
    // Filme já existe
    movieRef = existingMovie.docs[0].ref;
    movieData = existingMovie.docs[0].data();
    movieData.id = existingMovie.docs[0].id;
  } else {
    // Busca detalhes no TMDB
    movieData = await getTMDBMovieDetails(tmdbId);
    
    // Salva no Firestore
    movieRef = await db.collection("movies").add({
      ...movieData,
      createdAt: new Date()
    });
    
    movieData.id = movieRef.id;
    movieIsNew = true;
  }
  
  // Cria o release específico com o formato informado
  const releaseRef = await db.collection("movie_releases").add({
    movieId: movieData.id,
    format: format.toLowerCase(),
    barcode: barcode,
    region: "BR",
    distributor: null,
    releaseYear: movieData.year,
    coverImage: movieData.posterPath,
    createdAt: new Date()
  });
  
  const releaseData = {
    id: releaseRef.id,
    movieId: movieData.id,
    format: format.toLowerCase(),
    barcode: barcode,
    region: "BR",
    distributor: null,
    releaseYear: movieData.year,
    coverImage: movieData.posterPath
  };
  
  return {
    movie: movieData,
    release: releaseData,
    isNew: movieIsNew,
    message: movieIsNew ? "Filme e release criados com sucesso" : "Release criado para filme existente"
  };
}

module.exports = {
  addMovieFromTMDB
};