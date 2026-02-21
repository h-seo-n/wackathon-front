/// <reference lib="webworker" />

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBGrKGitOqCrhnVdqWNBX6I0mpcqOu1vXY",
  authDomain: "waffle-project-noti.firebaseapp.com",
  projectId: "waffle-project-noti",
  storageBucket: "waffle-project-noti.firebasestorage.app",
  messagingSenderId: "574928045387",
  appId: "1:574928045387:web:57a2ada8bb7b07159b14ce",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "알림";
  const options = {
    body: payload?.notification?.body || "",
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('push', function(event) {
  console.log("🔥 PUSH RECEIVED", event);
});