import { useEffect, useMemo, useRef, useState } from "react";
import type {
	SessionHistoryResponse,
	PointHistoryDto,
} from "@/utils/types/sessionTypes";

declare global {
	interface Window {
		kakao: any;
	}
}

type Props = {
	history: SessionHistoryResponse | null;
};

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

// user1/user2가 단일 객체로 올 수도, 배열로 올 수도 있어서 둘 다 처리
function toArray<T>(v: T | T[] | null | undefined): T[] {
	if (!v) return [];
	return Array.isArray(v) ? v : [v];
}

function isValidLatLng(p: any): p is { lat: number; lng: number } {
	return typeof p?.lat === "number" && typeof p?.lng === "number";
}

export default function MapHistory({ history }: Props) {
	const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY as string;

	const mapRef = useRef<any>(null);
	const user1PolylineRef = useRef<any>(null);
	const user2PolylineRef = useRef<any>(null);
	const markersRef = useRef<any[]>([]);

	const [ready, setReady] = useState(false);

	const { user1Points, user2Points } = useMemo(() => {
		const u1 = toArray((history as any)?.user1) as PointHistoryDto[];
		const u2 = toArray((history as any)?.user2) as PointHistoryDto[];
		return { user1Points: u1, user2Points: u2 };
	}, [history]);

	const user1Path = useMemo(() => {
		return user1Points
			.filter((p: any) => isValidLatLng(p))
			.map((p: any) => ({ lat: p.lat, lng: p.lng, type: p.type, ...p }));
	}, [user1Points]);

	const user2Path = useMemo(() => {
		return user2Points
			.filter((p: any) => isValidLatLng(p))
			.map((p: any) => ({ lat: p.lat, lng: p.lng, type: p.type, ...p }));
	}, [user2Points]);

	// 지도 초기화
	useEffect(() => {
		(async () => {
			await loadKakaoMap(KAKAO_KEY);

			const container = document.getElementById("history-map");
			if (!container) return;

			// 중심점: user1/user2 중 첫 번째 좌표가 있으면 그걸로, 없으면 서울 시청
			const fallback = new window.kakao.maps.LatLng(37.5665, 126.978);
			const first = user1Path[0] ?? user2Path[0] ?? null;

			const center = first
				? new window.kakao.maps.LatLng(first.lat, first.lng)
				: fallback;

			const map = new window.kakao.maps.Map(container, {
				center,
				level: 5,
			});
			mapRef.current = map;

			// 폴리라인 2개 (색상만 다르게)
			user1PolylineRef.current = new window.kakao.maps.Polyline({
				map,
				path: [],
				strokeWeight: 6,
				strokeColor: "#F6339A",
				strokeOpacity: 0.85,
				strokeStyle: "solid",
			});

			user2PolylineRef.current = new window.kakao.maps.Polyline({
				map,
				path: [],
				strokeWeight: 6,
				strokeColor: "#F9A8D4",
				strokeOpacity: 0.85,
				strokeStyle: "solid",
			});

			setReady(true);
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user1Path, user2Path]);

	// 경로/마커 업데이트
	useEffect(() => {
		if (!ready || !mapRef.current) return;

		const map = mapRef.current;

		// 기존 마커 제거
		markersRef.current.forEach((m) => {
			m.setMap(null);
		});
		markersRef.current = [];

		const toLatLng = (p: { lat: number; lng: number }) =>
			new window.kakao.maps.LatLng(p.lat, p.lng);

		// 폴리라인 path 세팅
		user1PolylineRef.current?.setPath(user1Path.map(toLatLng));
		user2PolylineRef.current?.setPath(user2Path.map(toLatLng));

		// bounds 맞추기 (둘 중 하나라도 있으면)
		const all = [...user1Path, ...user2Path];
		if (all.length > 0) {
			const bounds = new window.kakao.maps.LatLngBounds();
			all.forEach((p) => {
				bounds.extend(toLatLng(p));
			});
			map.setBounds(bounds, 40, 40, 40, 40);
		}

		// PHOTO/MEMO 같은 포인트는 마커로 표시(있으면)
		const makeMarker = (p: any, label: string) => {
			const marker = new window.kakao.maps.Marker({
				map,
				position: toLatLng(p),
				title: label,
			});
			markersRef.current.push(marker);

			// 간단한 인포윈도우(텍스트/사진 유무)
			const contentParts: string[] = [];
			if (p.type === "MEMO" && p.text)
				contentParts.push(`📝 ${escapeHtml(p.text)}`);
			if (p.type === "PHOTO" && p.photoPath)
				contentParts.push(`📷 ${escapeHtml(p.photoPath)}`);
			if (p.type === "MEET_DONE") contentParts.push("🤍 만남 기록");

			if (contentParts.length > 0) {
				const iw = new window.kakao.maps.InfoWindow({
					content: `<div style="padding:8px 10px;font-size:12px;line-height:1.3;">${contentParts.join(
						"<br/>",
					)}</div>`,
				});
				window.kakao.maps.event.addListener(marker, "click", () => {
					iw.open(map, marker);
				});
			}
		};

		// user1/user2 각각 포인트 중 "특수 이벤트"만 찍기
		user1Path.forEach((p: any) => {
			if (p.type === "PHOTO" || p.type === "MEMO" || p.type === "MEET_DONE") {
				makeMarker(p, "user1");
			}
		});
		user2Path.forEach((p: any) => {
			if (p.type === "PHOTO" || p.type === "MEMO" || p.type === "MEET_DONE") {
				makeMarker(p, "user2");
			}
		});
	}, [ready, user1Path, user2Path]);

	return (
		<div style={{ width: "100%", maxWidth: 400 }}>
			{/* 로딩/빈 상태 */}
			{!history && (
				<div style={{ fontSize: 13, color: "#666", padding: "8px 2px" }}>
					히스토리가 없어요.
				</div>
			)}

			{/* 지도 */}
			<div
				id="history-map"
				style={{
					width: "100%",
					height: 420,
					borderRadius: 16,
					overflow: "hidden",
					boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
					background: "#eee",
				}}
			/>

			{/* 간단한 범례 */}
			<div
				style={{
					display: "flex",
					gap: 10,
					marginTop: 10,
					fontSize: 12,
					color: "#555",
				}}
			>
				<LegendDot color="#F6339A" label="user1" />
				<LegendDot color="#F9A8D4" label="user2" />
			</div>
		</div>
	);
}

function LegendDot({ color, label }: { color: string; label: string }) {
	return (
		<div style={{ display: "flex", alignItems: "center", gap: 6 }}>
			<span
				style={{
					width: 10,
					height: 10,
					borderRadius: 999,
					background: color,
					display: "inline-block",
				}}
			/>
			<span>{label}</span>
		</div>
	);
}

function escapeHtml(input: string) {
	return input
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}
