const { admin, db } = require("../config/firebase");

async function createOrUpdateUser(uid, email, displayName) {
  const userRef = db.collection("users").doc(uid);
  const userDoc = await userRef.get();
  
  if (!userDoc.exists) {    
    await userRef.set({
      email: email,
      name: displayName || email.split("@")[0],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSeen: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      isNewUser: true,
      user: {
        uid: uid,
        email: email,
        name: displayName || email.split("@")[0]
      }
    };
  } else {
    await userRef.update({
      lastSeen: admin.firestore.FieldValue.serverTimestamp()
    });  
    const userData = userDoc.data();
    return {
      isNewUser: false,
      user: {
        uid: uid,
        email: userData.email,
        name: userData.name
      }
    };
  }
}

async function getUserProfile(uid) {
  const userDoc = await db.collection("users").doc(uid).get();  
  if (!userDoc.exists) {
    throw new Error("Usuário não encontrado");
  }
  return {
    uid: uid,
    ...userDoc.data()
  };
}

module.exports = {
  createOrUpdateUser,
  getUserProfile
};