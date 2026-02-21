// SessionMapPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { SessionProvider, useSession } from "@/context/SessionProvider";
import type { LatLng, SessionPoint } from "@/utils/types/sessionTypes";

declare global {
	interface Window {
		kakao: any;
	}
}

function loadKakaoMap(appKey: string) {
	return new Promise<void>((resolve, reject) => {
		if (window.kakao?.maps?.LatLng) return resolve();

		const script = document.createElement("script");
		script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
		script.async = true;
		script.onload = () => window.kakao.maps.load(() => resolve());
		script.onerror = () => reject(new Error("Failed to load Kakao Maps SDK"));
		document.head.appendChild(script);
	});
}

function createCircleMarker(color: string, size = 20) {
	const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="4" />
    </svg>
  `;

	return {
		content: svg,
		size: new window.kakao.maps.Size(size, size),
		anchor: new window.kakao.maps.Point(size / 2, size / 2),
	};
}

type Props = { sessionId: number };

export default function LiveMapPage({ sessionId }: Props) {
	return (
		<SessionProvider sessionId={sessionId}>
			<SessionMapInner />
		</SessionProvider>
	);
}

function formatElapsed(ms: number) {
	const totalSec = Math.floor(ms / 1000);
	const min = Math.floor(totalSec / 60);
	const sec = totalSec % 60;
	return `${min}:${String(sec).padStart(2, "0")}`;
}

// 두 점 사이 거리(m) (Haversine)
function distanceMeters(
	a: { lat: number; lng: number },
	b: { lat: number; lng: number },
) {
	const R = 6371000;
	const toRad = (v: number) => (v * Math.PI) / 180;
	const dLat = toRad(b.lat - a.lat);
	const dLng = toRad(b.lng - a.lng);
	const lat1 = toRad(a.lat);
	const lat2 = toRad(b.lat);

	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

	return 2 * R * Math.asin(Math.sqrt(h));
}

function SessionMapInner() {
	const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY as string;

	const {
		sessionId,
		status,
		myPos,
		partnerPos,
		isWsConnected,
		sendMeetAndFinish,
		reloadHistory,
		// ✅ Provider가 제공해야 함 (아래 참고)
		uploadPhotoAndBroadcast,
	} = useSession() as any as {
		sessionId: number | null;
		status: string | null;
		myPos: LatLng | null;
		partnerPos: LatLng | null;
		isWsConnected: boolean;
		sendMeetAndFinish: (pos: LatLng) => Promise<void>;
		reloadHistory: () => Promise<void>;
		history: SessionPoint[];
		uploadPhotoAndBroadcast: (
			file: File,
			text?: string,
		) => Promise<SessionPoint>;
	};

	const mapRef = useRef<any>(null);
	const myMarkerRef = useRef<any>(null);
	const partnerMarkerRef = useRef<any>(null);
	const myPolylineRef = useRef<any>(null);
	const partnerPolylineRef = useRef<any>(null);

	const [myTrail, setMyTrail] = useState<LatLng[]>([]);
	const [partnerTrail, setPartnerTrail] = useState<LatLng[]>([]);

	const [ready, setReady] = useState(false);
	const [photoUploading, setPhotoUploading] = useState(false);

	// 하단 카드용 UI 상태(“활성화” 토글 표시용)
	const [shareMy, setShareMy] = useState(true);
	const [sharePartner, setSharePartner] = useState(true);

	// 경과 시간 (일단 페이지 진입 시점 기준)
	const startAtRef = useRef<number>(Date.now());
	const [elapsed, setElapsed] = useState("0:00");

	// ✅ 새로고침 시 history 다시 받아오기 (요구사항 1)
	useEffect(() => {
		void reloadHistory();
	}, [reloadHistory]);

	useEffect(() => {
		const t = window.setInterval(() => {
			setElapsed(formatElapsed(Date.now() - startAtRef.current));
		}, 1000);
		return () => window.clearInterval(t);
	}, []);

	// 1) Kakao Map init (중요: 한번만 init)
	useEffect(() => {
		(async () => {
			await loadKakaoMap(KAKAO_KEY);

			const container = document.getElementById("session-map");
			if (!container) return;

			let center = new window.kakao.maps.LatLng(37.5665, 126.978); // 서울 시청 기본

			if (navigator.geolocation) {
				try {
					const position = await new Promise<GeolocationPosition>((res, rej) =>
						navigator.geolocation.getCurrentPosition(res, rej),
					);
					const { latitude, longitude } = position.coords;
					center = new window.kakao.maps.LatLng(latitude, longitude);
				} catch (err) {
					console.warn(
						"Failed to get user location, using default center",
						err,
					);
				}
			}

			const map = new window.kakao.maps.Map(container, { center, level: 3 });
			mapRef.current = map;

			myPolylineRef.current = new window.kakao.maps.Polyline({
				map,
				path: [],
				strokeWeight: 6,
				strokeColor: "#F6339A",
				strokeOpacity: 0.8,
				strokeStyle: "solid",
			});

			partnerPolylineRef.current = new window.kakao.maps.Polyline({
				map,
				path: [],
				strokeColor: "#F9A8D4",
				strokeWeight: 6,
				strokeOpacity: 0.8,
				strokeStyle: "solid",
			});

			setReady(true);
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// 2) 내 위치 마커 업데이트 (표시 토글 반영)
	useEffect(() => {
		if (!ready || !mapRef.current) return;

		const map = mapRef.current;

		// shareMy가 꺼지면 마커/폴리라인 숨김
		if (!shareMy) {
			if (myMarkerRef.current) myMarkerRef.current.setMap(null);
			// 폴리라인은 setMap(null)로 숨김 가능
			if (myPolylineRef.current) myPolylineRef.current.setMap(null);
			return;
		} else {
			// 다시 켤 때 map 연결 복구
			if (myPolylineRef.current) myPolylineRef.current.setMap(map);
			if (myMarkerRef.current && myMarkerRef.current.getMap() == null) {
				myMarkerRef.current.setMap(map);
			}
		}

		if (!myPos) return;

		const ll = new window.kakao.maps.LatLng(myPos.lat, myPos.lng);

		if (!myMarkerRef.current) {
			const markerImage = createCircleMarker("#F6339A", 18);
			myMarkerRef.current = new window.kakao.maps.Marker({
				map,
				position: ll,
				image: new window.kakao.maps.MarkerImage(
					"data:image/svg+xml;charset=UTF-8," +
						encodeURIComponent(markerImage.content),
					markerImage.size,
					{ offset: markerImage.anchor },
				),
				title: "나",
			});
		} else {
			myMarkerRef.current.setPosition(ll);
		}

		// 처음만 센터 잡고 싶으면 플래그 추가 가능. 지금은 계속 따라감.
		map.setCenter(ll);
	}, [ready, myPos, shareMy]);

	// 3) 상대 위치 마커 업데이트 (표시 토글 반영)
	useEffect(() => {
		if (!ready || !mapRef.current) return;

		const map = mapRef.current;

		if (!sharePartner) {
			if (partnerMarkerRef.current) partnerMarkerRef.current.setMap(null);
			if (partnerPolylineRef.current) partnerPolylineRef.current.setMap(null);
			return;
		} else {
			if (partnerPolylineRef.current) partnerPolylineRef.current.setMap(map);
			if (
				partnerMarkerRef.current &&
				partnerMarkerRef.current.getMap() == null
			) {
				partnerMarkerRef.current.setMap(map);
			}
		}

		if (!partnerPos) return;

		const ll = new window.kakao.maps.LatLng(partnerPos.lat, partnerPos.lng);

		if (!partnerMarkerRef.current) {
			const markerImage = createCircleMarker("#F9A8D4", 18);
			partnerMarkerRef.current = new window.kakao.maps.Marker({
				map,
				position: ll,
				image: new window.kakao.maps.MarkerImage(
					"data:image/svg+xml;charset=UTF-8," +
						encodeURIComponent(markerImage.content),
					markerImage.size,
					{ offset: markerImage.anchor },
				),
				title: "상대",
			});
		} else {
			partnerMarkerRef.current.setPosition(ll);
		}
	}, [ready, partnerPos, sharePartner]);

	// 4) 폴리라인 업데이트 (trail 축적은 표시 토글과 무관하게 유지)
	useEffect(() => {
		if (!myPos) return;
		setMyTrail((prev) => [...prev.slice(-200), myPos]);
	}, [myPos]);

	useEffect(() => {
		if (!partnerPos) return;
		setPartnerTrail((prev) => [...prev.slice(-200), partnerPos]);
	}, [partnerPos]);

	useEffect(() => {
		if (!ready) return;
		const toLatLng = (p: LatLng) => new window.kakao.maps.LatLng(p.lat, p.lng);

		// 표시가 꺼져있으면 굳이 setPath 안 해도 됨 (하지만 해도 문제없음)
		if (shareMy) myPolylineRef.current?.setPath(myTrail.map(toLatLng));
		if (sharePartner)
			partnerPolylineRef.current?.setPath(partnerTrail.map(toLatLng));
	}, [ready, myTrail, partnerTrail, shareMy, sharePartner]);

	const handleMeet = async () => {
		if (!myPos) return;
		await sendMeetAndFinish(myPos);
	};

	// ✅ (7) 사진 업로드: Provider 액션으로 처리 (업로드→응답(SessionPoint)→WS 재전송→history 갱신)
	const handlePhotoUpload = async (file: File) => {
		if (!sessionId) return;
		setPhotoUploading(true);
		try {
			await uploadPhotoAndBroadcast(file);
			// provider 내부에서 reloadHistory 해주지만, 안전하게 한 번 더 원하면 아래 유지
			// await reloadHistory();
		} finally {
			setPhotoUploading(false);
		}
	};

	const distText = useMemo(() => {
		if (!myPos || !partnerPos) return null;
		const m = distanceMeters(myPos, partnerPos);
		if (m >= 1000) return `거리 ${(m / 1000).toFixed(1)}km`;
		return `거리 ${Math.round(m)}m`;
	}, [myPos, partnerPos]);

	// ✅ 히스토리 기반으로 trail을 복원하고 싶다면(새로고침 시 경로 이어붙이기):
	// - 현재는 실시간 위치로만 trail을 만들고 있음.
	// - 아래 주석을 풀면 "POINT" 타입만 골라서 초기 trail 세팅 가능.
	// useEffect(() => {
	// 	if (!ready) return;
	// 	const myPoints = history
	// 		.filter((p) => p.type === "POINT" && p.lat != null && p.lng != null)
	// 		.map((p) => ({ lat: p.lat as number, lng: p.lng as number }));
	// 	setMyTrail(myPoints.slice(-200));
	// }, [history, ready]);

	return (
		<div style={styles.page}>
			<div style={styles.mapWrap}>
				<div id="session-map" style={styles.map} />

				<div style={styles.topLeftStack}>
					{distText && <div style={styles.distancePill}>{distText}</div>}
				</div>

				<div style={styles.topRightStack}>
					<label style={styles.iconBtn}>
						📷
						<input
							type="file"
							accept="image/*"
							disabled={photoUploading}
							style={{ display: "none" }}
							onChange={(e) => {
								const f = e.target.files?.[0];
								if (f) handlePhotoUpload(f);
								e.currentTarget.value = "";
							}}
						/>
					</label>
				</div>

				<div style={styles.meetBtnWrap}>
					<button
						type="button"
						onClick={handleMeet}
						disabled={!myPos}
						style={{
							...styles.meetBtn,
							opacity: !myPos ? 0.6 : 1,
							cursor: !myPos ? "not-allowed" : "pointer",
						}}
					>
						🤍 만남 기록
					</button>
				</div>

				<div style={styles.bottomCardWrap}>
					<div style={styles.bottomCard}>
						<div style={styles.row}>
							<div style={styles.rowLeft}>
								<span style={styles.clockDot} />
								<span style={styles.rowLabel}>경과 시간</span>
							</div>
							<div style={styles.rowValue}>{elapsed}</div>
						</div>

						<div style={styles.divider} />

						<div style={styles.row}>
							<div style={styles.rowLeft}>
								<span style={styles.pinkDot} />
								<span style={styles.rowLabel}>내 위치 표시</span>
							</div>
							<button
								type="button"
								onClick={() => setShareMy((v) => !v)}
								style={{
									...styles.toggleText,
									color: shareMy ? "#1DB954" : "#999",
								}}
							>
								{shareMy ? "활성화" : "비활성"}
							</button>
						</div>

						<div style={styles.row}>
							<div style={styles.rowLeft}>
								<span style={styles.lightPinkDot} />
								<span style={styles.rowLabel}>상대 위치 표시</span>
							</div>
							<button
								type="button"
								onClick={() => setSharePartner((v) => !v)}
								style={{
									...styles.toggleText,
									color: sharePartner ? "#1DB954" : "#999",
								}}
							>
								{sharePartner ? "활성화" : "비활성"}
							</button>
						</div>

						<div style={{ marginTop: 10, fontSize: 12, color: "#888" }}>
							상태: {status ?? "로딩중"} · WS:{" "}
							{isWsConnected ? "연결됨" : "끊김"}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

const styles: Record<string, React.CSSProperties> = {
	page: {
		width: "100%",
		height: "100vh",
		overflow: "hidden",
	},
	mapWrap: {
		position: "relative",
		width: "100%",
		height: "100%",
	},
	map: {
		width: "100%",
		height: "100%",
	},

	topLeftStack: {
		position: "absolute",
		top: 16,
		left: 16,
		display: "flex",
		flexDirection: "column",
		gap: 10,
		zIndex: 20,
	},
	distancePill: {
		background: "rgba(255,255,255,0.95)",
		borderRadius: 14,
		padding: "10px 14px",
		boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
		fontWeight: 700,
		fontSize: 16,
		letterSpacing: "-0.2px",
	},

	topRightStack: {
		position: "absolute",
		top: 16,
		right: 16,
		display: "flex",
		gap: 10,
		zIndex: 20,
	},
	iconBtn: {
		width: 44,
		height: 44,
		borderRadius: 14,
		border: "1px solid rgba(0,0,0,0.08)",
		background: "rgba(255,255,255,0.95)",
		boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		cursor: "pointer",
		fontSize: 18,
		userSelect: "none",
	},

	bottomCardWrap: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 18,
		display: "flex",
		justifyContent: "center",
		padding: "0 16px",
		zIndex: 20,
		pointerEvents: "none",
	},
	bottomCard: {
		width: "100%",
		maxWidth: 340,
		background: "rgba(255,255,255,0.97)",
		borderRadius: 18,
		boxShadow: "0 10px 30px rgba(0,0,0,0.16)",
		padding: 14,
		pointerEvents: "auto",
	},
	row: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		padding: "6px 2px",
	},
	rowLeft: {
		display: "flex",
		alignItems: "center",
		gap: 10,
	},
	rowLabel: {
		fontSize: 14,
		fontWeight: 600,
		color: "#222",
		letterSpacing: "-0.2px",
	},
	rowValue: {
		fontSize: 18,
		fontWeight: 800,
		color: "#111",
		letterSpacing: "-0.3px",
	},
	divider: {
		height: 1,
		background: "rgba(0,0,0,0.08)",
		margin: "6px 0",
	},
	toggleText: {
		border: "none",
		background: "transparent",
		fontSize: 14,
		fontWeight: 700,
		cursor: "pointer",
	},
	clockDot: {
		width: 10,
		height: 10,
		borderRadius: 999,
		background: "#ff2d55",
	},
	pinkDot: {
		width: 10,
		height: 10,
		borderRadius: 999,
		background: "#ff2d55",
	},
	lightPinkDot: {
		width: 10,
		height: 10,
		borderRadius: 999,
		background: "#ff8aa5",
	},
	meetBtnWrap: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 250,
		display: "flex",
		justifyContent: "center",
		zIndex: 20,
		pointerEvents: "none",
	},
	meetBtn: {
		pointerEvents: "auto",
		padding: "14px 28px",
		borderRadius: 999,
		border: "none",
		background: "linear-gradient(135deg, #ff2d55, #ff6b81)",
		color: "white",
		fontSize: 15,
		fontWeight: 700,
		boxShadow: "0 10px 25px rgba(255,45,85,0.35)",
		letterSpacing: "-0.3px",
	},
};
