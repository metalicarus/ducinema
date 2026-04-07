const apiKey = process.env.TMDB_API_KEY;
if (!apiKey) {
  throw new Error("TMDB_API_KEY não configurada nas variáveis de ambiente");
}

module.exports = {
  apiKey,
  baseUrl: "https://api.themoviedb.org/3",
  language: "pt-BR"
};