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
} from "../api/session";
import type {
	SessionPoint,
	SessionStatus,
	LatLng,
	SessionState,
	FinishSessionRequest,
} from "@/utils/types/sessionTypes";
import api from "../api/axios";
import { openSessionWs, type WsPayload } from "../ws/sessionWs";
import { useAuth } from "../contexts/AuthContext";

const SessionContext = createContext<SessionState | null>(null);

export function useSession() {
	const ctx = useContext(SessionContext);
	if (!ctx) throw new Error("useSession must be used within SessionProvider");
	return ctx;
}

type Props = {
	/** 라우트에서 주입받는 sessionId (세션 생성/수락에서 바뀔 수 있어서 내부 state로도 관리) */
	sessionId: number;
	children: React.ReactNode;
};

export function SessionProvider({
	sessionId: initialSessionId,
	children,
}: Props) {
	const { user } = useAuth();
	const myUserId = user?.id ?? null;

	const [sessionId, setSessionId] = useState<number>(initialSessionId);

	const [status, setStatus] = useState<SessionStatus | null>(null);
	const [myPos, setMyPos] = useState<LatLng | null>(null);
	const [partnerPos, setPartnerPos] = useState<LatLng | null>(null);
	const [history, setHistory] = useState<SessionPoint[]>([]);
	const [isWsConnected, setIsWsConnected] = useState(false);

	const wsRef = useRef<ReturnType<typeof openSessionWs> | null>(null);

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
	// WS send / connect / disconnect
	// ---------------------------
	type WsOutMessage = WsPayload;

	const sendWs = useCallback((msg: WsOutMessage) => {
		wsRef.current?.send(msg);
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

		wsRef.current?.close();
		wsRef.current = null;
		setIsWsConnected(false);
	}, [clearSendInterval, stopWatchPosition]);

	const connectWs = useCallback(
		(sid: number) => {
			disconnectWs();

			const token = localStorage.getItem("accessToken");
			if (!token) {
				console.warn("No accessToken; skip ws connect");
				return;
			}

			wsRef.current = openSessionWs(sid, token ?? "", {
				onOpen: () => {
					setIsWsConnected(true);
					startWatchPosition();
					startSendInterval();
				},
				onClose: () => {
					setIsWsConnected(false);
					clearSendInterval();
					stopWatchPosition();
				},
				onError: () => {
					setIsWsConnected(false);
					clearSendInterval();
					stopWatchPosition();
				},
				onMessage: (msg: any) => {
					if (!msg || typeof msg !== "object") return;

					switch (msg.type) {
						case "POINT": {
							// 서버가 브로드캐스트로 userId를 붙여준다고 가정 
							const senderId =
								typeof msg.userId === "number" ? (msg.userId as number) : null;

							// 내 에코(내가 보낸 POINT를 내가 다시 받은 것)면 무시
							if (myUserId != null && senderId === myUserId) {
								return;
							}

							// 상대 위치만 partnerPos로 반영
							if (msg.lat != null && msg.lng != null) {
								setPartnerPos({ lat: msg.lat, lng: msg.lng });
							}
							
							if (msg.text || msg.photoPath) void reloadHistory();
							break;
						}
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
				},
			});
		},
		[
			disconnectWs,
			clearSendInterval,
			stopWatchPosition,
			startWatchPosition,
			startSendInterval,
			reloadHistory,
			reloadStatus,
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
		if (!status) return;

		// DONE이면 붙어있던 WS도 끊어주는 게 안전
		if (status === "DONE") {
			if (isWsConnected) disconnectWs();
			return;
		}

		if (isWsConnected) return;

		connectWs(sessionId);
	}, [status, sessionId, connectWs, disconnectWs, isWsConnected]);

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
