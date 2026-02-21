// SessionMapPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { SessionProvider, useSession } from "../context/SessionProvider";
import { uploadSessionPhoto, uploadSessionMessage } from "../api/session";
import type { LatLng } from "../utils/types";

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
		history,
		isWsConnected,
		sendMeetAndFinish,
		reloadHistory,
		// 만약 provider에 stopSharing / startSharing 등을 넣었다면 여기서 같이 쓰면 더 좋음
	} = useSession();

	const mapRef = useRef<any>(null);
	const myMarkerRef = useRef<any>(null);
	const partnerMarkerRef = useRef<any>(null);
	const myPolylineRef = useRef<any>(null);
	const partnerPolylineRef = useRef<any>(null);

	const [myTrail, setMyTrail] = useState<LatLng[]>([]);
	const [partnerTrail, setPartnerTrail] = useState<LatLng[]>([]);

	const [ready, setReady] = useState(false);
	const [photoUploading, setPhotoUploading] = useState(false);
	const [messageUploading, setMessageUploading] = useState(false);

	// 하단 카드용 UI 상태(“활성화” 토글 표시용)
	const [shareMy, setShareMy] = useState(true);
	const [sharePartner, setSharePartner] = useState(true);

	// 경과 시간 (일단 페이지 진입 시점 기준)
	const startAtRef = useRef<number>(Date.now());
	const [elapsed, setElapsed] = useState("0:00");

	useEffect(() => {
		const t = window.setInterval(() => {
			setElapsed(formatElapsed(Date.now() - startAtRef.current));
		}, 1000);
		return () => window.clearInterval(t);
	}, []);

	// 1) Kakao Map init (중요: myPos를 dependency로 두면 지도 재생성됨 → 한번만 init 추천)
	useEffect(() => {
		(async () => {
			await loadKakaoMap(KAKAO_KEY);

			const container = document.getElementById("session-map");
			if (!container) return;

			let center = new window.kakao.maps.LatLng(37.5665, 126.978); // 서울 시청 기본 위치

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
			const map = new window.kakao.maps.Map(container, {
				center,
				level: 3,
			});
			mapRef.current = map;

			myPolylineRef.current = new window.kakao.maps.Polyline({
				map,
				path: [],
				strokeWeight: 6,
				strokeOpacity: 0.8,
				strokeStyle: "solid",
			});

			partnerPolylineRef.current = new window.kakao.maps.Polyline({
				map,
				path: [],
				strokeWeight: 6,
				strokeOpacity: 0.8,
				strokeStyle: "solid",
			});

			setReady(true);
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// 2) 내 위치 마커 업데이트
	useEffect(() => {
		if (!ready || !mapRef.current || !myPos) return;
		const map = mapRef.current;
		const ll = new window.kakao.maps.LatLng(myPos.lat, myPos.lng);

		if (!myMarkerRef.current) {
			myMarkerRef.current = new window.kakao.maps.Marker({
				map,
				position: ll,
				title: "나",
			});
		} else {
			myMarkerRef.current.setPosition(ll);
		}

		// 처음만 센터 잡고 싶으면 플래그 추가 가능
		map.setCenter(ll);
	}, [ready, myPos]);

	// 3) 상대 위치 마커 업데이트
	useEffect(() => {
		if (!ready || !mapRef.current || !partnerPos) return;
		const map = mapRef.current;
		const ll = new window.kakao.maps.LatLng(partnerPos.lat, partnerPos.lng);

		if (!partnerMarkerRef.current) {
			partnerMarkerRef.current = new window.kakao.maps.Marker({
				map,
				position: ll,
				title: "상대",
			});
		} else {
			partnerMarkerRef.current.setPosition(ll);
		}
	}, [ready, partnerPos]);

	// 4) 폴리라인 업데이트
	useEffect(() => {
		if (!myPos) return;
		setMyTrail((prev) => [...prev.slice(-200), myPos]); // 최대 200개
	}, [myPos]);

	useEffect(() => {
		if (!partnerPos) return;
		setPartnerTrail((prev) => [...prev.slice(-200), partnerPos]);
	}, [partnerPos]);

	useEffect(() => {
		if (!ready) return;
		const toLatLng = (p: LatLng) => new window.kakao.maps.LatLng(p.lat, p.lng);
		myPolylineRef.current?.setPath(myTrail.map(toLatLng));
		partnerPolylineRef.current?.setPath(partnerTrail.map(toLatLng));
	}, [ready, myTrail, partnerTrail]);

	const handleMeet = async () => {
		if (!myPos) return;
		await sendMeetAndFinish(myPos);
	};

	const handlePhotoUpload = async (file: File) => {
		if (!sessionId) return;
		setPhotoUploading(true);
		try {
			await uploadSessionPhoto(sessionId, file);
			await reloadHistory();
		} finally {
			setPhotoUploading(false);
		}
	};

	const handleMessageUpload = async (message: string) => {
		if (!sessionId) return;
		setMessageUploading(true);
		try {
			await uploadSessionMessage(sessionId, message);
			await reloadHistory();
		} finally {
			setMessageUploading(false);
		}
	}

	const distText = useMemo(() => {
		if (!myPos || !partnerPos) return null;
		const m = distanceMeters(myPos, partnerPos);
		if (m >= 1000) return `거리 ${(m / 1000).toFixed(1)}km`;
		return `거리 ${Math.round(m)}m`;
	}, [myPos, partnerPos]);

	return (
		<div style={styles.page}>
			{/* 지도 영역(풀스크린) */}
			<div style={styles.mapWrap}>
				<div id="session-map" style={styles.map} />

				{/* 좌상단 거리 pill */}
				<div style={styles.topLeftStack}>
					{distText && <div style={styles.distancePill}>{distText}</div>}
				</div>

				{/* 우상단 (선택) 사진 업로드/만남 기록 같은 액션을 작은 버튼으로 */}
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
					<label style={styles.iconBtn}>
						✉
						<input
							type="text"
							accept="image/*"
							disabled={messageUploading}
							style={{ display: "none" }}
							onChange={(e) => {
								handleMessageUpload(e.target.value);
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

				{/* 하단 카드 */}
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
								<span style={styles.rowLabel}>내 위치 공유</span>
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
								<span style={styles.rowLabel}>상대방 위치 공유</span>
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

						{/* 상태표시(원하면 숨겨도 됨) */}
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
		pointerEvents: "none", // 지도 드래그 방해 최소화
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
		bottom: 250, // 카드 위에 뜨도록 조정
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
