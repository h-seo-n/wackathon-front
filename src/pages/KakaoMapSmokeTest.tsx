// src/pages/KakaoMapSmokeTest.tsx
import { useEffect, useRef, useState } from "react";

declare global {
	interface Window {
		kakao: any;
	}
}

const KAKAO_APPKEY = import.meta.env.VITE_KAKAO_MAP_KEY as string | undefined;

export default function KakaoMapSmokeTest() {
	const mapRef = useRef<HTMLDivElement | null>(null);
	const [status, setStatus] = useState<string>("init");

	useEffect(() => {
		if (!KAKAO_APPKEY) {
			setStatus("❌ VITE_KAKAO_MAP_APP_KEY가 없습니다. .env에 넣어주세요.");
			return;
		}

		// 이미 로드되어 있으면 바로 초기화
		if (window.kakao?.maps) {
			setStatus("✅ kakao.maps already loaded");
			initMap();
			return;
		}

		setStatus("⏳ loading kakao map script...");

		const script = document.createElement("script");
		script.async = true;
		script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APPKEY}&autoload=false`;

		script.onload = () => {
			setStatus("✅ script loaded. initializing...");
			window.kakao.maps.load(() => {
				setStatus("✅ kakao.maps.load done");
				initMap();
			});
		};

		script.onerror = () => {
			setStatus("❌ script load failed (appkey/도메인 등록/CSP 확인)");
		};

		document.head.appendChild(script);

		return () => {
			// 테스트 페이지라 보통 유지해도 되지만, 필요하면 제거
			// document.head.removeChild(script);
		};

		function initMap() {
			if (!mapRef.current) return;

			const center = new window.kakao.maps.LatLng(37.5665, 126.978); // 서울 시청 근처
			const map = new window.kakao.maps.Map(mapRef.current, {
				center,
				level: 5,
			});

			const marker = new window.kakao.maps.Marker({ position: center });
			marker.setMap(map);

			const infowindow = new window.kakao.maps.InfoWindow({
				content: `<div style="padding:6px 10px;font-size:12px;">카카오맵 로딩 OK ✅</div>`,
			});
			infowindow.open(map, marker);
		}
	}, []);

	return (
		<div style={{ padding: 16 }}>
			<h2 style={{ marginBottom: 8 }}>Kakao Map Smoke Test</h2>
			<div style={{ marginBottom: 12, fontSize: 14 }}>{status}</div>

			<div
				ref={mapRef}
				style={{
					width: "100%",
					maxWidth: 900,
					height: 520,
					borderRadius: 12,
					border: "1px solid #e5e7eb",
					overflow: "hidden",
				}}
			/>
			<p style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
				* 지도가 안 뜨면: (1) 앱키 확인 (2) 카카오 개발자 콘솔에 현재 도메인
				등록 (3) 콘솔 에러(CSP/혼합콘텐츠) 확인
			</p>
		</div>
	);
}
