// src/contexts/SessionProvider.tsx
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	finishSession,
	getSessionHistory,
	getSessionStatus,
} from "../api/session";
import type {
	SessionPoint,
	SessionStatus,
	LatLng,
	SessionState,
} from "../utils/types";
import { TokenService } from "../api/tokenService";

const SessionContext = createContext<SessionState | null>(null);

export function useSession() {
	const ctx = useContext(SessionContext);
	if (!ctx) throw new Error("useSession must be used within SessionProvider");
	return ctx;
}

type WsClientMessage =
	| { type: "JOIN_SESSION"; sessionId: number; accessToken?: string }
	| {
			type: "SEND_LOCATION";
			sessionId: number;
			lat: number;
			lng: number;
			ts?: number;
	  }
	| { type: "MEET"; sessionId: number; lat: number; lng: number; ts?: number };

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
	| {
			type: "PARTNER_PHOTO";
			sessionId: number;
			photoUrl: string;
			lat?: number;
			lng?: number;
			ts?: number;
	  }
	| { type: "ERROR"; message: string };

type Props = {
	sessionId: number;
	children: React.ReactNode;
};

export function SessionProvider({ sessionId, children }: Props) {
	const WS_URL = import.meta.env.VITE_WS_URL as string;

	const [status, setStatus] = useState<SessionStatus | null>(null);
	const [myPos, setMyPos] = useState<LatLng | null>(null);
	const [partnerPos, setPartnerPos] = useState<LatLng | null>(null);
	const [history, setHistory] = useState<SessionPoint[]>([]);
	const [isWsConnected, setIsWsConnected] = useState(false);

	const wsRef = useRef<WebSocket | null>(null);
	const watchIdRef = useRef<number | null>(null);

	// ✅ stable
	const reloadHistory = useCallback(async () => {
		const data = await getSessionHistory(sessionId);
		setHistory(data.points ?? []);
	}, [sessionId]);

	// ✅ stable: ref만 쓰므로 deps []
	const sendWs = useCallback((msg: WsClientMessage) => {
		const ws = wsRef.current;
		if (!ws || ws.readyState !== WebSocket.OPEN) return;
		ws.send(JSON.stringify(msg));
	}, []);

	// ✅ stable
	const sendMyLocation = useCallback(
		(pos: LatLng) => {
			setMyPos(pos);
			sendWs({
				type: "SEND_LOCATION",
				sessionId,
				lat: pos.lat,
				lng: pos.lng,
				ts: Date.now(),
			});
		},
		[sendWs, sessionId],
	);

	// ✅ stable
	const sendMeet = useCallback(
		(pos: LatLng) => {
			sendWs({
				type: "MEET",
				sessionId,
				lat: pos.lat,
				lng: pos.lng,
				ts: Date.now(),
			});
		},
		[sendWs, sessionId],
	);

	// ✅ stable
	const stopWatchPosition = useCallback(() => {
		if (watchIdRef.current === null) return;
		navigator.geolocation.clearWatch(watchIdRef.current);
		watchIdRef.current = null;
	}, []);

	// ✅ stable
	const startWatchPosition = useCallback(() => {
		if (watchIdRef.current !== null) return;
		if (!navigator.geolocation) return;

		watchIdRef.current = navigator.geolocation.watchPosition(
			(pos) => {
				console.log("[GPS] coords", {
					lat: pos.coords.latitude,
					lng: pos.coords.longitude,
					acc: pos.coords.accuracy,
					ts: pos.timestamp,
				});
				sendMyLocation({
					lat: pos.coords.latitude,
					lng: pos.coords.longitude,
				});
			},
			(err) => {
				console.error("geolocation error:", err);
			},
			{
				enableHighAccuracy: true,
				maximumAge: 1000,
				timeout: 10000,
			},
		);
	}, [sendMyLocation]);

	// ✅ stable
	const stopSharing = useCallback(() => {
		// 위치 감시 중단
		stopWatchPosition();

		// 소켓 닫기
		const ws = wsRef.current;
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.close();
		}
		wsRef.current = null;

		setIsWsConnected(false);
	}, [stopWatchPosition]);

	// ✅ stable
	const meetAndFinish = useCallback(
		async (pos: LatLng) => {
			// 1) 만남 이벤트 전송 (WS)
			sendWs({
				type: "MEET",
				sessionId,
				lat: pos.lat,
				lng: pos.lng,
				ts: Date.now(),
			});

			// 2) 세션 종료 (REST)
			await finishSession(sessionId);

			// 3) 프론트에서 위치 공유 종료
			stopSharing();

			// 4) 히스토리 갱신 (선택)
			await reloadHistory();
		},
		[reloadHistory, sendWs, sessionId, stopSharing],
	);

	// ✅ 1) status & history 초기 로드
	useEffect(() => {
		let mounted = true;
		(async () => {
			const s = await getSessionStatus(sessionId);
			if (!mounted) return;
			setStatus(s.status);
			await reloadHistory();
		})();

		return () => {
			mounted = false;
		};
	}, [sessionId, reloadHistory]);

	// ✅ 2) WebSocket 연결 + JOIN
	useEffect(() => {
		if (!WS_URL) return;

		const ws = new WebSocket(WS_URL);
		wsRef.current = ws;

		ws.onopen = () => {
			setIsWsConnected(true);
			const accessToken = TokenService.getToken?.() ?? undefined;
			sendWs({ type: "JOIN_SESSION", sessionId, accessToken });
		};

		ws.onclose = () => {
			setIsWsConnected(false);
		};

		ws.onerror = () => {
			setIsWsConnected(false);
		};

		ws.onmessage = (event) => {
			let msg: WsServerMessage | null = null;
			try {
				msg = JSON.parse(event.data);
			} catch {
				return;
			}
			if (!msg) return;

			switch (msg.type) {
				case "AUTH_OK":
				case "JOINED":
					startWatchPosition();
					break;

				case "PARTNER_LOCATION":
					if (msg.sessionId !== sessionId) return;
					setPartnerPos({ lat: msg.lat, lng: msg.lng });
					break;

				case "PARTNER_PHOTO":
					// 비동기지만 fire-and-forget이면 void로 명시해도 좋음
					void reloadHistory();
					break;

				case "ERROR":
					console.error("[WS ERROR]", msg.message);
					break;
			}
		};

		return () => {
			stopWatchPosition();
			ws.close();
			wsRef.current = null;
		};
	}, [
		sessionId,
		sendWs,
		startWatchPosition,
		stopWatchPosition,
		reloadHistory,
	]);

	// ✅ value도 함수 포함해서 메모 (stale 방지)
	const value = useMemo<SessionState>(
		() => ({
			sessionId,
			status,
			myPos,
			partnerPos,
			history,
			isWsConnected,
			reloadHistory,
			sendMyLocation,
			sendMeet,
			sendMeetAndFinish: meetAndFinish,
			stopSharing,
		}),
		[
			sessionId,
			status,
			myPos,
			partnerPos,
			history,
			isWsConnected,
			reloadHistory,
			sendMyLocation,
			sendMeet,
			meetAndFinish,
			stopSharing,
		],
	);

	return (
		<SessionContext.Provider value={value}>{children}</SessionContext.Provider>
	);
}