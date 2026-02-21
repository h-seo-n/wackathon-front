// src/mocks/wsHandlers.ts
import { ws } from "msw";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:5173/ws";
export const locationWS = ws.link(WS_URL);

// SessionProvider의 WsServerMessage에 맞춤
type WsServerMessage =
	| { type: "JOINED"; sessionId: number }
	| { type: "AUTH_OK"; sessionId: number }
	| {
			type: "PARTNER_LOCATION";
			sessionId: number;
			lat: number;
			lng: number;
			userId?: number;
			ts?: number;
	  }
	| { type: "PARTNER_PHOTO"; sessionId: number; photoUrl: string; ts?: number }
	| { type: "ERROR"; message: string };

const livePath: Array<{ lat: number; lng: number }> = [
	{ lat: 37.5445, lng: 127.0557 }, // 성수 생각공장 데시앙플렉스 근처
	{ lat: 37.5449, lng: 127.0563 },
	{ lat: 37.5453, lng: 127.057 },
	{ lat: 37.5457, lng: 127.0576 },
	{ lat: 37.5461, lng: 127.0582 },
	{ lat: 37.5465, lng: 127.0588 },
	{ lat: 37.546, lng: 127.0594 },
	{ lat: 37.5455, lng: 127.059 },
	{ lat: 37.5459, lng: 127.0563 },
	{ lat: 37.5453, lng: 127.056 },
	{ lat: 37.545, lng: 127.0576 },
	{ lat: 37.5454, lng: 127.0582 },
	{ lat: 37.5465, lng: 127.0588 },
	{ lat: 37.547, lng: 127.0594 },
	{ lat: 37.5472, lng: 127.059 },
	{ lat: 37.546, lng: 127.06 },
	{ lat: 37.5455, lng: 127.064 },
	{ lat: 37.5459, lng: 127.066 },
	{ lat: 37.5453, lng: 127.07 },
	{ lat: 37.545, lng: 127.0723 },
	{ lat: 37.5454, lng: 127.07 },
	{ lat: 37.5465, lng: 127.071 },
	{ lat: 37.547, lng: 127.073 },
];

export const wsHandlers = [
	locationWS.addEventListener("connection", ({ client }) => {
		// 네 App에서 sessionId=1로 바꿨다고 했으니 기본 1
		const sessionId = 1;

		// ✅ 연결되면 JOINED/AUTH_OK를 먼저 보내서
		// Provider가 startWatchPosition()을 시작하도록 함
		const joined: WsServerMessage = { type: "JOINED", sessionId };
		client.send(JSON.stringify(joined));

		// (원하면 AUTH_OK로 바꿔도 됨)
		// client.send(JSON.stringify({ type: "AUTH_OK", sessionId } satisfies WsServerMessage));

		// ✅ 이후 주기적으로 파트너 위치를 보냄
		let i = 0;
		const timer = window.setInterval(() => {
			const p = livePath[i % livePath.length];

			const payload: WsServerMessage = {
				type: "PARTNER_LOCATION",
				sessionId,
				lat: p.lat,
				lng: p.lng,
				userId: 2, // 상대방 id처럼
				ts: Date.now(),
			};

			client.send(JSON.stringify(payload));
			i += 1;
		}, 1000);

		client.addEventListener("close", () => {
			window.clearInterval(timer);
		});
	}),
];
