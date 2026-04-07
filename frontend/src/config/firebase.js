import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyC6ZUU2RQDpyqK1WfQNePbovSoZX3O9moI",
  authDomain: "du-cinema.firebaseapp.com",
  projectId: "du-cinema",
  storageBucket: "du-cinema.firebasestorage.app",
  messagingSenderId: "134183867768",
  appId: "1:134183867768:web:ef42dcbfb3d6738386a48d",
  measurementId: "G-Q3JW2TGKMG"
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

export { auth }
