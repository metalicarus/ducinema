const { admin, db } = require("../config/firebase");

async function addToCollection(userId, releaseId, itemData) {
  const releaseDoc = await db.collection("movie_releases").doc(releaseId).get();

  if (!releaseDoc.exists) {
    throw new Error("Release não encontrado");
  }

  const existingItem = await db.collection("user_collections")
    .where("userId", "==", userId)
    .where("releaseId", "==", releaseId)
    .get();

  if (!existingItem.empty) {
    throw new Error("Você já possui este release na sua coleção");
  }

  const release = releaseDoc.data();

  const collectionRef = await db.collection("user_collections").add({
    userId: userId,
    releaseId: releaseId,
    format: release.format || null, // desnormalizado para filtros eficientes
    condition: itemData.condition || "usado",
    location: itemData.location || null,
    purchaseDate: itemData.purchaseDate || null,
    price: itemData.price || null,
    notes: itemData.notes || null,
    addedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  const itemId = collectionRef.id;

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

async function getUserCollection(userId, filters = {}) {
  let query = db.collection("user_collections")
    .where("userId", "==", userId);

  if (filters.format) {
    query = query.where("format", "==", filters.format);
  }

  const snapshot = await query.get();

  if (snapshot.empty) {
    return [];
  }

  const items = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const itemData = doc.data();

      const releaseDoc = await db.collection("movie_releases").doc(itemData.releaseId).get();
      const release = releaseDoc.exists ? releaseDoc.data() : null;

      const movieDoc = release?.movieId
        ? await db.collection("movies").doc(release.movieId).get()
        : null;
      const movie = movieDoc?.exists ? movieDoc.data() : null;

      return {
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
      };
    })
  );

  return items;
}

async function removeFromCollection(itemId, userId) {
  const itemDoc = await db.collection("user_collections").doc(itemId).get();

  if (!itemDoc.exists) {
    throw new Error("Item não encontrado");
  }

  const itemData = itemDoc.data();

  if (itemData.userId !== userId) {
    throw new Error("Você não tem permissão para remover este item");
  }

  await db.collection("user_collections").doc(itemId).delete();

  return { success: true, message: "Item removido da coleção" };
}

async function updateCollectionItem(itemId, userId, updates) {
  const itemDoc = await db.collection("user_collections").doc(itemId).get();

  if (!itemDoc.exists) {
    throw new Error("Item não encontrado");
  }

  const itemData = itemDoc.data();

  if (itemData.userId !== userId) {
    throw new Error("Você não tem permissão para atualizar este item");
  }

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