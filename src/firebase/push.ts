import { getToken } from "firebase/messaging";
import { messaging } from "./firebase";

const VAPID_PUBLIC_KEY = "BKpv-Q40rTjC7ocnkVU8Vh4a19Zpnt7d9N2GEbHLzOTaqJqdIJ3CDeCBthGDTl3U_7xAzZXC_4KLVa_iDqJ4fOI";

export async function checkCorsHealth() {
  try {
    const response = await fetch("http://localhost:8080/api/health", {
      method: "GET",
    });

    const text = await response.text();
    console.log("[CORS CHECK] status:", response.status, "body:", text);
  } catch (error) {
    console.error("[CORS CHECK] request failed:", error);
  }
}

export async function enablePush() {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    alert("알림 권한이 거부됨");
    return;
  }

  const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

  const token = await getToken(messaging, {
    vapidKey: VAPID_PUBLIC_KEY,
    serviceWorkerRegistration: swReg,
  });

  console.log("FCM TOKEN:", token);

  return token;
}
