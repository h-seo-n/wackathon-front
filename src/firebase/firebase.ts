// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBGrKGitOqCrhnVdqWNBX6I0mpcqOu1vXY",
  authDomain: "waffle-project-noti.firebaseapp.com",
  projectId: "waffle-project-noti",
  storageBucket: "waffle-project-noti.firebasestorage.app",
  messagingSenderId: "574928045387",
  appId: "1:574928045387:web:57a2ada8bb7b07159b14ce",
};

const app = initializeApp(firebaseConfig);

export const messaging = getMessaging(app);