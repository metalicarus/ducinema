const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");

// Importa rotas
const searchRoutes = require("./route/search");
const movieRoutes = require('./route/movie');
const collectionRoutes = require("./route/collection");
const authRoutes = require("./route/auth");
const emailRoutes = require('./route/email')
const { onRequest } = require('firebase-functions/v2/https')

// Cria app Express
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Rota de teste
app.get("/", (req, res) => {
  res.json({ message: "API Du Cinéma funcionando!" });
});

// Registra rotas
app.use("/search", searchRoutes);
app.use("/movies", movieRoutes);
app.use("/collection", collectionRoutes);
app.use("/auth", authRoutes);
app.use('/email', emailRoutes)

// Exporta como Cloud Function
exports.api = onRequest(
  { 
    secrets: ['RESEND_API_KEY'],
    cors: true 
  }, 
  app
)