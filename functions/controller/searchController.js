const { db } = require("../config/firebase");
const tmdbConfig = require("../config/tmdb");
const { isBarcode, formatMovie } = require("../utils/helper");
const fetch = require("node-fetch");

async function searchByBarcode(barcode) {
  const releaseSnapshot = await db.collection("movie_releases")
    .where("barcode", "==", barcode)
    .get();

  if (releaseSnapshot.empty) {
    return { type: "release", release: null, movie: null };
  }

  const releaseDoc = releaseSnapshot.docs[0];
  const release = releaseDoc.data();
  const movieDoc = await db.collection("movies").doc(release.movieId).get();
  const movie = movieDoc.exists ? movieDoc.data() : null;

  return {
    type: "release",
    release: { id: releaseDoc.id, ...release },
    movie: movie ? formatMovie(movie, "local", movieDoc.id) : null
  };
}

async function searchLocalMovies(query) {
  const queryLower = query.toLowerCase();

  const moviesSnapshot = await db.collection("movies")
    .where("titleLower", ">=", queryLower)
    .where("titleLower", "<=", queryLower + "\uf8ff")
    .limit(10)
    .get();

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

async function searchTMDB(query, page = 1) {
  const url = `${tmdbConfig.baseUrl}/search/movie?query=${encodeURIComponent(query)}&language=${tmdbConfig.language}&page=${page}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${tmdbConfig.apiKey}` }
  });

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }

  const data = await response.json();

  const movies = (data.results || []).map(movie => formatMovie(movie, "tmdb"));

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
