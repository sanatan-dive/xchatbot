// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCvNdjc_YZlxGvUCNOgbmB4eIQNir3icBw",
  authDomain: "xchatbot-6d748.firebaseapp.com",
  projectId: "xchatbot-6d748",
  storageBucket: "xchatbot-6d748.firebasestorage.app",
  messagingSenderId: "602001216434",
  appId: "1:602001216434:web:001f636057895040cf0aab",
  measurementId: "G-HR979CXRE3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);