// src/mocks/wsHandlers.ts
import { ws } from "msw";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:5173/ws";
export const locationWS = ws.link(WS_URL);

type LiveLocation = {
  type: "LOCATION";
  sessionId: number;
  lat: number;
  lng: number;
  t: number;
  actor: "me" | "partner";
};

const livePath: Array<{ lat: number; lng: number }> = [
  { lat: 37.5445, lng: 127.0557 }, // 생각공장 근처
  { lat: 37.5449, lng: 127.0563 },
  { lat: 37.5453, lng: 127.0570 },
  { lat: 37.5457, lng: 127.0576 },
  { lat: 37.5461, lng: 127.0582 },
  { lat: 37.5465, lng: 127.0588 },
  { lat: 37.5460, lng: 127.0594 },
  { lat: 37.5455, lng: 127.0590 },
];

export const wsHandlers = [
  locationWS.addEventListener("connection", ({ client }) => {
    // 클라이언트 연결되자마자 mock 서버가 주기적으로 위치를 push
    let i = 0;
    const sessionId = 1;

    const timer = window.setInterval(() => {
      const p = livePath[i % livePath.length];
      const payload: LiveLocation = {
        type: "LOCATION",
        sessionId,
        lat: p.lat,
        lng: p.lng,
        t: Date.now(),
        actor: i % 2 === 0 ? "me" : "partner",
      };

      client.send(JSON.stringify(payload));
      i += 1;
    }, 1000);

    client.addEventListener("close", () => {
      window.clearInterval(timer);
    });
  }),
];