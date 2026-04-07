function isBarcode(value) {
  const barcodePattern = /^\d{8,13}$/;
  return barcodePattern.test(value);
}

function formatMovie(movieData, source = "local", docId = null) {
  return {
    id: docId,
    tmdbId: movieData.tmdbId || movieData.id,
    title: movieData.title,
    originalTitle: movieData.originalTitle || movieData.original_title,
    year: movieData.year || (movieData.release_date ? new Date(movieData.release_date).getFullYear() : null),
    posterPath: movieData.posterPath || movieData.poster_path,
    director: movieData.director,
    overview: movieData.overview,
    source: source
  };
}

module.exports = {
  isBarcode,
  formatMovie
};