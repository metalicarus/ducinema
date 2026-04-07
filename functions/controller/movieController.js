const { db, admin } = require("../config/firebase");
const tmdbConfig = require("../config/tmdb");
const fetch = require("node-fetch");

async function getTMDBMovieDetails(tmdbId) {
  const url = `${tmdbConfig.baseUrl}/movie/${tmdbId}?language=${tmdbConfig.language}&append_to_response=credits,videos`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${tmdbConfig.apiKey}` }
  });

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }

  const movie = await response.json();

  const director = movie.credits?.crew?.find(person => person.job === "Director")?.name || null;

  const cast = movie.credits?.cast?.slice(0, 10).map(actor => ({
    name: actor.name,
    character: actor.character,
    profilePath: actor.profile_path
  })) || [];

  const trailer = movie.videos?.results?.find(
    video => video.type === "Trailer" && video.site === "YouTube"
  )?.key || null;

  return {
    tmdbId: movie.id,
    title: movie.title,
    titleLower: movie.title?.toLowerCase() || "",
    originalTitle: movie.original_title,
    year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
    posterPath: movie.poster_path,
    backdropPath: movie.backdrop_path,
    overview: movie.overview,
    director,
    cast,
    trailer,
    runtime: movie.runtime,
    genres: movie.genres?.map(g => g.name) || [],
    voteAverage: movie.vote_average,
    releaseDate: movie.release_date
  };
}

async function addMovieFromTMDB(tmdbId, format, barcode = null) {
  const numericTmdbId = parseInt(tmdbId, 10);
  if (isNaN(numericTmdbId)) {
    throw new Error("tmdbId inválido");
  }

  const validFormats = ["vhs", "dvd", "bluray", "4k", "outros"];
  const normalizedFormat = format.toLowerCase();
  if (!validFormats.includes(normalizedFormat)) {
    throw new Error(`Formato inválido. Use: ${validFormats.join(", ")}`);
  }

  if (barcode) {
    const existingRelease = await db.collection("movie_releases")
      .where("barcode", "==", barcode)
      .get();

    if (!existingRelease.empty) {
      const releaseDoc = existingRelease.docs[0];
      const releaseData = releaseDoc.data();
      const movieDoc = await db.collection("movies").doc(releaseData.movieId).get();

      return {
        movie: { id: movieDoc.id, ...movieDoc.data() },
        release: { id: releaseDoc.id, ...releaseData },
        isNew: false,
        message: "Release com este código de barras já existe"
      };
    }
  }

  const movieRef = db.collection("movies").doc(String(numericTmdbId));
  const movieSnapshot = await movieRef.get();

  let movieData;
  let movieIsNew = false;

  if (movieSnapshot.exists) {
    movieData = { id: movieSnapshot.id, ...movieSnapshot.data() };
  } else {
    try {
      movieData = await getTMDBMovieDetails(numericTmdbId);
    } catch (err) {
      throw new Error(`Erro ao buscar filme no TMDB (id=${numericTmdbId}): ${err.message}`);
    }

    await movieRef.set({ ...movieData, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    movieData.id = movieRef.id;
    movieIsNew = true;
  }

  const releasePayload = {
    movieId: movieData.id,
    format: normalizedFormat,
    region: "BR",
    distributor: null,
    releaseYear: movieData.year,
    coverImage: movieData.posterPath,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    ...(barcode && { barcode })
  };

  const releaseRef = await db.collection("movie_releases").add(releasePayload);

  return {
    movie: movieData,
    release: { id: releaseRef.id, ...releasePayload },
    isNew: movieIsNew,
    message: movieIsNew ? "Filme e release criados com sucesso" : "Release criado para filme existente"
  };
}

module.exports = {
  addMovieFromTMDB
};
