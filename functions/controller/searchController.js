const { db } = require("../config/firebase");
const tmdbConfig = require("../config/tmdb");
const { isBarcode, formatMovie } = require("../utils/helper");
const fetch = require("node-fetch");

// Pesquisar por código de barras
async function searchByBarcode(barcode) {
  const releaseSnapshot = await db.collection("movie_releases")
    .where("barcode", "==", barcode)
    .get();
  
  if (releaseSnapshot.empty) {
    return null;
  }
  
  const releaseDoc = releaseSnapshot.docs[0];
  const release = releaseDoc.data();
  
  // Buscar informações do filme
  const movieDoc = await db.collection("movies").doc(release.movieId).get();
  const movie = movieDoc.exists ? movieDoc.data() : null;
  
  return {
    type: "release",
    release: {
      id: releaseDoc.id,
      ...release
    },
    movie: movie ? formatMovie(movie, "local", movieDoc.id) : null
  };
}

// Pesquisar por título no banco local
async function searchLocalMovies(query) {
  const moviesSnapshot = await db.collection("movies")
    .where("title", ">=", query)
    .where("title", "<=", query + "\uf8ff")
    .limit(10)
    .get();
  
  if (moviesSnapshot.empty) {
    return null;
  }
  
  const movies = [];
  moviesSnapshot.forEach(doc => {
    movies.push(formatMovie(doc.data(), "local", doc.id));
  });
  
  return {
    type: "movies",
    results: movies,
    count: movies.length,
    source: "local"
  };
}

// Pesquisar no TMDB
async function searchTMDB(query, page = 1) {
  const url = `${tmdbConfig.baseUrl}/search/movie?api_key=${tmdbConfig.apiKey}&query=${encodeURIComponent(query)}&language=${tmdbConfig.language}&page=${page}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!data.results || data.results.length === 0) {
    return null;
  }
  
  const movies = data.results.slice(0, 20).map(movie => formatMovie(movie, "tmdb"));
  
  return {
    type: "movies",
    results: movies,
    count: movies.length,
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    source: "tmdb"
  };
}

module.exports = {
  searchByBarcode,
  searchLocalMovies,
  searchTMDB
};