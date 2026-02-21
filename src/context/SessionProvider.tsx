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
	uploadSessionPhoto,
	createSession,
	// getSessions, // 필요하면 사용
} from "../api/session";
import type {
	SessionPoint,
	SessionStatus,
	LatLng,
	SessionState,
	FinishSessionRequest,
} from "@/utils/types/sessionTypes";
import api from "../api/axios";

const SessionContext = createContext<SessionState | null>(null);

export function useSession() {
	const ctx = useContext(SessionContext);
	if (!ctx) throw new Error("useSession must be used within SessionProvider");
	return ctx;
}

/**
 * WS로 보내는 payload 스펙 (요구사항 기준)
 */
type WsOutMessage =
	| {
			type: "POINT";
			lat: number;
			lng: number;
			ts: number;
			text?: string;
			photoPath?: string;
	  }
	| { type: "MEET_CONFIRM"; lat: number; lng: number; ts: number }
	| { type: "CANCEL"; ts: number };

/**
 * 서버로부터 받을 수 있는 메시지(최소한으로 유연하게)
 * - 서버가 POINT를 브로드캐스트하면 이걸로 받는다고 가정
 * - text/photoPath 포함 가능
 */
type WsInMessage =
	| {
			type: "POINT";
			lat: number;
			lng: number;
			ts?: number;
			text?: string;
			photoPath?: string;
			userId?: number;
	  }
	| {
			type: "MEET_CONFIRM";
			lat: number;
			lng: number;
			ts?: number;
			userId?: number;
	  }
	| { type: "CANCEL"; ts?: number; userId?: number }
	| { type: "ERROR"; message: string };

type Props = {
	/** 라우트에서 주입받는 sessionId (세션 생성/수락에서 바뀔 수 있어서 내부 state로도 관리) */
	sessionId: number;
	children: React.ReactNode;
};

export function SessionProvider({
	sessionId: initialSessionId,
	children,
}: Props) {
	/**
	 * env 예시:
	 * - VITE_WS_DOMAIN = "waffle-project-dev-server.xyz"  (또는 "wss://..." 전체)
	 * - 또는 VITE_WS_URL = "wss://waffle-project-dev-server.xyz"
	 *
	 * 아래 buildWsUrl에서 알아서 합침.
	 */
	const WS_BASE = (import.meta.env.VITE_WS_URL as string) || ""; // 예: "wss://domain"
	// 만약 VITE_WS_URL이 없고 VITE_API_URL만 있다면, 필요시 거기서 도메인 파싱해도 됨(지금은 생략)

	const [sessionId, setSessionId] = useState<number>(initialSessionId);

	const [status, setStatus] = useState<SessionStatus | null>(null);
	const [myPos, setMyPos] = useState<LatLng | null>(null);
	const [partnerPos, setPartnerPos] = useState<LatLng | null>(null);
	const [history, setHistory] = useState<SessionPoint[]>([]);
	const [isWsConnected, setIsWsConnected] = useState(false);

	const wsRef = useRef<WebSocket | null>(null);

	// 위치 추적은 watchPosition으로 "최신 좌표"만 갱신하고
	// WS 전송은 setInterval로 3초마다 전송한다.
	const watchIdRef = useRef<number | null>(null);
	const sendIntervalRef = useRef<number | null>(null);
	const latestPosRef = useRef<LatLng | null>(null);

	// ---------------------------
	// REST helpers
	// ---------------------------

	const reloadHistory = useCallback(async () => {
		const data = await getSessionHistory(sessionId);
		setHistory(data.points ?? []);
	}, [sessionId]);

	const reloadStatus = useCallback(async () => {
		const s = await getSessionStatus(sessionId);
		setStatus(s.status);
	}, [sessionId]);

	// 세션 수락: POST /sessions/{sessionId}/accept
	// (api/session.ts에 따로 함수로 빼는 게 베스트)
	const acceptSession = useCallback(async (sid: number) => {
		await api.post(`/sessions/${sid}/accept`);
	}, []);

	// ---------------------------
	// WS URL builder
	// ---------------------------

	const buildWsUrl = useCallback((sid: number) => {
		const token = localStorage.getItem("accessToken");
		if (!token) {
			// 토큰 없으면 연결해도 인증 실패 가능성이 큼
			// (원하면 throw 처리)
			console.warn("[WS] token missing");
		}

		// WS_BASE가 "wss://domain" 또는 "wss://domain/" 라고 가정
		const base = WS_BASE.replace(/\/+$/, "");
		// 스펙: wss://<domain>/ws/session?sessionId=123&token=<JWT>
		const url = `${base}/ws/session?sessionId=${encodeURIComponent(
			String(sid),
		)}&token=${encodeURIComponent(token || "")}`;
		return url;
	}, []);

	// ---------------------------
	// WS send / connect / disconnect
	// ---------------------------

	const sendWs = useCallback((msg: WsOutMessage) => {
		const ws = wsRef.current;
		if (!ws || ws.readyState !== WebSocket.OPEN) return;
		ws.send(JSON.stringify(msg));
	}, []);

	const clearSendInterval = useCallback(() => {
		if (sendIntervalRef.current !== null) {
			window.clearInterval(sendIntervalRef.current);
			sendIntervalRef.current = null;
		}
	}, []);

	const stopWatchPosition = useCallback(() => {
		if (watchIdRef.current === null) return;
		navigator.geolocation.clearWatch(watchIdRef.current);
		watchIdRef.current = null;
	}, []);

	const startWatchPosition = useCallback(() => {
		if (!navigator.geolocation) return;
		if (watchIdRef.current !== null) return;

		watchIdRef.current = navigator.geolocation.watchPosition(
			(pos) => {
				const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
				latestPosRef.current = next;
				setMyPos(next);
			},
			(err) => {
				console.error("[GPS] error:", err);
			},
			{
				enableHighAccuracy: true,
				maximumAge: 1000,
				timeout: 10000,
			},
		);
	}, []);

	const startSendInterval = useCallback(() => {
		// 이미 돌고 있으면 중복 시작 방지
		if (sendIntervalRef.current !== null) return;

		sendIntervalRef.current = window.setInterval(() => {
			const p = latestPosRef.current;
			if (!p) return;
			// (4) 3초마다 위치를 POINT로 전송
			sendWs({ type: "POINT", lat: p.lat, lng: p.lng, ts: Date.now() });
		}, 3000);
	}, [sendWs]);

	const disconnectWs = useCallback(() => {
		clearSendInterval();
		stopWatchPosition();

		const ws = wsRef.current;
		if (
			ws &&
			(ws.readyState === WebSocket.OPEN ||
				ws.readyState === WebSocket.CONNECTING)
		) {
			ws.close();
		}
		wsRef.current = null;
		setIsWsConnected(false);
	}, [clearSendInterval, stopWatchPosition]);

	const connectWs = useCallback(
		(sid: number) => {
			// 기존 연결 정리
			disconnectWs();

			const url = buildWsUrl(sid);
			const ws = new WebSocket(url);
			wsRef.current = ws;

			ws.onopen = () => {
				setIsWsConnected(true);
				// (4) 위치 감시 시작 + (4) 3초 주기 전송 시작
				startWatchPosition();
				startSendInterval();
			};

			ws.onclose = () => {
				setIsWsConnected(false);
				// (6) 종료 시 정리
				clearSendInterval();
				stopWatchPosition();
			};

			ws.onerror = () => {
				setIsWsConnected(false);
				clearSendInterval();
				stopWatchPosition();
			};

			ws.onmessage = (event) => {
				let msg: WsInMessage | null = null;
				try {
					msg = JSON.parse(event.data);
				} catch {
					return;
				}
				if (!msg) return;

				switch (msg.type) {
					case "POINT":
						// 파트너의 최신 위치로 추정(서버가 userId 구분 준다면 더 정확히 처리 가능)
						setPartnerPos({ lat: msg.lat, lng: msg.lng });
						// 히스토리에 누적되는 구조면 서버 저장 후 브로드캐스트 될 것이므로 갱신
						void reloadHistory();
						break;

					case "MEET_CONFIRM":
						void reloadStatus();
						void reloadHistory();
						break;

					case "CANCEL":
						void reloadStatus();
						break;

					case "ERROR":
						console.error("[WS ERROR]", msg.message);
						break;
				}
			};
		},
		[
			buildWsUrl,
			clearSendInterval,
			disconnectWs,
			reloadHistory,
			reloadStatus,
			startSendInterval,
			startWatchPosition,
			stopWatchPosition,
		],
	);

	// ---------------------------
	// Actions (요구사항 5,7,2,3)
	// ---------------------------

	// 수동 텍스트 포인트 생성 (payload 전송)
	const sendTextPoint = useCallback(
		(text: string) => {
			const p = latestPosRef.current ?? myPos;
			if (!p) return;
			sendWs({ type: "POINT", lat: p.lat, lng: p.lng, ts: Date.now(), text });
		},
		[myPos, sendWs],
	);

	// 만남 확정
	const sendMeetConfirm = useCallback(
		(pos?: LatLng) => {
			const p = pos ?? latestPosRef.current ?? myPos;
			if (!p) return;
			sendWs({ type: "MEET_CONFIRM", lat: p.lat, lng: p.lng, ts: Date.now() });
		},
		[myPos, sendWs],
	);

	// 수동 취소
	const sendCancel = useCallback(() => {
		sendWs({ type: "CANCEL", ts: Date.now() });
		// 필요하면 REST로도 finish 호출
	}, [sendWs]);

	// (7) 사진 업로드 -> 응답(photoPath 등) 받으면 WS로 다시 송신
	const uploadPhotoAndBroadcast = useCallback(
		async (file: File, text?: string) => {
			const point: SessionPoint = await uploadSessionPhoto(
				sessionId,
				file,
				text,
			);

			// 서버가 저장한 좌표/경로를 우선 사용 (없으면 내 최신 좌표 fallback)
			const fallback = latestPosRef.current ?? myPos;

			const lat = point.lat ?? fallback?.lat;
			const lng = point.lng ?? fallback?.lng;

			if (lat == null || lng == null) {
				console.warn("[uploadPhotoAndBroadcast] no lat/lng to broadcast");
				return point;
			}

			// WS 스펙: photoPath를 담아 POINT로 전송
			sendWs({
				type: "POINT",
				lat,
				lng,
				ts: Date.now(),
				...(point.text ? { text: point.text } : {}),
				...(point.photoPath ? { photoPath: point.photoPath } : {}),
			});

			// 화면 동기화: history 다시 로드
			void reloadHistory();

			return point;
		},
		[myPos, reloadHistory, sendWs, sessionId],
	);

	// (2) 세션 수락 -> WS 시작
	const acceptAndStart = useCallback(
		async (sid: number) => {
			await acceptSession(sid);
			setSessionId(sid);
			await reloadStatus();
			await reloadHistory();
			connectWs(sid);
		},
		[acceptSession, connectWs, reloadHistory, reloadStatus],
	);

	// (3) 세션 생성 -> WS 시작
	const createAndStart = useCallback(async () => {
		const s = await createSession();
		setSessionId(s.id);
		setStatus(s.status);
		await reloadHistory();
		connectWs(s.id);
		return s;
	}, [connectWs, reloadHistory]);

	// (6) stopSharing: 연결/전송/감시 종료
	const stopSharing = useCallback(() => {
		disconnectWs();
	}, [disconnectWs]);

	// 기존 meetAndFinish는 “WS로 MEET_CONFIRM 보내고, REST finishSession”로 정리
	const meetAndFinish = useCallback(
		async (pos: LatLng) => {
			sendMeetConfirm(pos);

			const body: FinishSessionRequest = { reason: "MEET_CONFIRMED" };
			await finishSession(sessionId, body);

			stopSharing();
			await reloadStatus();
			await reloadHistory();
		},
		[reloadHistory, reloadStatus, sendMeetConfirm, sessionId, stopSharing],
	);

	// ---------------------------
	// (1) 새로고침/진입 시 status & history 로드
	// ---------------------------

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const s = await getSessionStatus(sessionId);
				if (!mounted) return;
				setStatus(s.status);
				await reloadHistory();
			} catch (e) {
				console.error("[SessionProvider] init load failed:", e);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [sessionId, reloadHistory]);

	// ---------------------------
	// WS 자동 시작 조건
	// - 요구사항: 수락/생성 시 자동 시작
	// - 여기서는 "props로 sessionId 들어왔고, status가 ACTIVE면 붙는다" 같은 로직을 원하면 추가 가능
	// ---------------------------
	useEffect(() => {
		// 초기 진입 시 자동 연결을 원하면 아래 주석 해제:
		// connectWs(sessionId);

		return () => {
			disconnectWs();
		};
	}, [disconnectWs]);

	// ---------------------------
	// SessionState 제공 (기존 인터페이스에 맞춰 유지)
	// + 필요하면 SessionState에 아래 액션들을 추가하는 게 좋음:
	//   acceptAndStart, createAndStart, sendTextPoint, sendCancel, uploadPhotoAndBroadcast
	// ---------------------------

	const value = useMemo<SessionState>(
		() => ({
			sessionId,
			status,
			myPos,
			partnerPos,
			history,
			isWsConnected,

			reloadHistory,

			// 기존 시그니처 유지:
			sendMyLocation: (pos: LatLng) => {
				latestPosRef.current = pos;
				setMyPos(pos);
				// 즉시 보내고 싶다면 아래처럼:
				sendWs({ type: "POINT", lat: pos.lat, lng: pos.lng, ts: Date.now() });
			},

			// 기존 sendMeet는 스펙상 MEET_CONFIRM으로 대체
			sendMeet: (pos: LatLng) => {
				sendWs({
					type: "MEET_CONFIRM",
					lat: pos.lat,
					lng: pos.lng,
					ts: Date.now(),
				});
			},

			sendMeetAndFinish: meetAndFinish,
			stopSharing,

			acceptAndStart,
			createAndStart,
			sendTextPoint,
			sendCancel,
			uploadPhotoAndBroadcast,
		}),
		[
			history,
			isWsConnected,
			meetAndFinish,
			myPos,
			partnerPos,
			reloadHistory,
			sendWs,
			sessionId,
			status,
			stopSharing,
			acceptAndStart,
			createAndStart,
			sendTextPoint,
			sendCancel,
			uploadPhotoAndBroadcast,
		],
	);

	return (
		<SessionContext.Provider value={value}>{children}</SessionContext.Provider>
	);
}
