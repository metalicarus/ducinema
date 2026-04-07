const { db, admin } = require("../config/firebase");

// Adicionar release à coleção do usuário
async function addToCollection(userId, releaseId, itemData) {
  // Verifica se o release existe
  const releaseDoc = await db.collection("movie_releases").doc(releaseId).get();
  
  if (!releaseDoc.exists) {
    throw new Error("Release não encontrado");
  }
  
  // Verifica se o usuário já tem este release na coleção
  const existingItem = await db.collection("user_collections")
    .where("userId", "==", userId)
    .where("releaseId", "==", releaseId)
    .get();
  
  if (!existingItem.empty) {
    throw new Error("Você já possui este release na sua coleção");
  }
  
  // Adiciona à coleção
  const collectionRef = await db.collection("user_collections").add({
    userId: userId,
    releaseId: releaseId,
    condition: itemData.condition || "usado",
    location: itemData.location || null,
    purchaseDate: itemData.purchaseDate || null,
    price: itemData.price || null,
    notes: itemData.notes || null,
    addedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  const itemId = collectionRef.id;
  
  // Busca dados completos para retornar
  const release = releaseDoc.data();
  const movieDoc = await db.collection("movies").doc(release.movieId).get();
  const movie = movieDoc.exists ? movieDoc.data() : null;
  
  return {
    id: itemId,
    userId: userId,
    releaseId: releaseId,
    condition: itemData.condition || "usado",
    location: itemData.location,
    purchaseDate: itemData.purchaseDate,
    price: itemData.price,
    notes: itemData.notes,
    release: {
      id: releaseDoc.id,
      ...release
    },
    movie: movie ? {
      id: movieDoc.id,
      ...movie
    } : null
  };
}

// Listar coleção do usuário
async function getUserCollection(userId, filters = {}) {
  let query = db.collection("user_collections")
    .where("userId", "==", userId);
  
  // Filtros opcionais
  if (filters.format) {
    // Precisaremos fazer join manual depois
  }
  
  const snapshot = await query.get();
  
  if (snapshot.empty) {
    return [];
  }
  
  const collection = [];
  
  // Para cada item, busca dados do release e do filme
  for (const doc of snapshot.docs) {
    const itemData = doc.data();
    
    // Busca release
    const releaseDoc = await db.collection("movie_releases").doc(itemData.releaseId).get();
    const release = releaseDoc.exists ? releaseDoc.data() : null;
    
    // Busca filme
    let movie = null;
    if (release && release.movieId) {
      const movieDoc = await db.collection("movies").doc(release.movieId).get();
      movie = movieDoc.exists ? movieDoc.data() : null;
    }
    
    // Aplica filtro de formato se necessário
    if (filters.format && release && release.format !== filters.format) {
      continue;
    }
    
    collection.push({
      id: doc.id,
      userId: itemData.userId,
      releaseId: itemData.releaseId,
      condition: itemData.condition,
      location: itemData.location,
      purchaseDate: itemData.purchaseDate,
      price: itemData.price,
      notes: itemData.notes,
      addedAt: itemData.addedAt,
      release: release ? {
        id: releaseDoc.id,
        movieId: release.movieId,
        format: release.format,
        barcode: release.barcode,
        region: release.region,
        distributor: release.distributor,
        releaseYear: release.releaseYear,
        coverImage: release.coverImage
      } : null,
      movie: movie ? {
        id: release.movieId,
        tmdbId: movie.tmdbId,
        title: movie.title,
        originalTitle: movie.originalTitle,
        year: movie.year,
        posterPath: movie.posterPath,
        director: movie.director,
        genres: movie.genres
      } : null
    });
  }
  
  return collection;
}

// Remover item da coleção
async function removeFromCollection(itemId, userId) {
  const itemDoc = await db.collection("user_collections").doc(itemId).get();
  
  if (!itemDoc.exists) {
    throw new Error("Item não encontrado");
  }
  
  const itemData = itemDoc.data();
  
  // Verifica se o item pertence ao usuário
  if (itemData.userId !== userId) {
    throw new Error("Você não tem permissão para remover este item");
  }
  
  await db.collection("user_collections").doc(itemId).delete();
  
  return { success: true, message: "Item removido da coleção" };
}

// Atualizar informações do item na coleção
async function updateCollectionItem(itemId, userId, updates) {
  const itemDoc = await db.collection("user_collections").doc(itemId).get();
  
  if (!itemDoc.exists) {
    throw new Error("Item não encontrado");
  }
  
  const itemData = itemDoc.data();
  
  // Verifica se o item pertence ao usuário
  if (itemData.userId !== userId) {
    throw new Error("Você não tem permissão para atualizar este item");
  }
  
  // Campos permitidos para atualização
  const allowedFields = ["condition", "location", "purchaseDate", "price", "notes"];
  const updateData = {};
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      updateData[field] = updates[field];
    }
  }
  
  if (Object.keys(updateData).length === 0) {
    throw new Error("Nenhum campo válido para atualizar");
  }
  
  updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
  
  await db.collection("user_collections").doc(itemId).update(updateData);
  
  return {
    id: itemId,
    ...itemData,
    ...updateData
  };
}

module.exports = {
  addToCollection,
  getUserCollection,
  removeFromCollection,
  updateCollectionItem
};