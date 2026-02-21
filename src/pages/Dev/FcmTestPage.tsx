import { useState } from "react";
import { enablePush } from "@/firebase/push";

// const LOCAL_HOST_URL = "http://localhost:8080/api/noti/token"
const NOTI_TOKEN_API_URL = "https://waffle-project-dev-server.xyz/api/noti/token";




const FcmTestPage = () => {
	const [status, setStatus] = useState("대기 중");
	const [accessToken, setAccessToken] = useState("");
	const [fcmToken, setFcmToken] = useState("");

	const handleEnablePush = async () => {
		setStatus("요청 중...");

		try {
			const token = await enablePush();
			if (!token) {
				setStatus("권한 거부 또는 토큰 발급 실패");
				return;
			}

			setFcmToken(token);
			setStatus(`토큰 발급 성공: ${token.slice(0, 20)}...`);
		} catch (error) {
			setStatus(`실패: ${String(error)}`);
		}
	};

	const handleSendTokenToBackend = async () => {
		if (!fcmToken) {
			setStatus("먼저 FCM 토큰을 발급해 주세요.");
			return;
		}

		if (!accessToken.trim()) {
			setStatus("액세스 토큰을 입력해 주세요.");
			return;
		}

		setStatus("백엔드 전송 중...");

		try {
			const response = await fetch(NOTI_TOKEN_API_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken.trim()}`,
				},
				body: JSON.stringify({ token: fcmToken }),
			});

			const bodyText = await response.text();
			if (!response.ok) {
				setStatus(`전송 실패 (${response.status}): ${bodyText}`);
				return;
			}

			setStatus(`전송 성공 (${response.status})`);
		} catch (error) {
			setStatus(`전송 실패: ${String(error)}`);
		}
	};

	return (
		<div style={{ padding: 24 }}>
			<h1>FCM Test</h1>
			<button type="button" onClick={handleEnablePush}>
				푸시 권한/토큰 테스트
			</button>
			<div style={{ marginTop: 16 }}>
				<input
					type="text"
					value={accessToken}
					onChange={(event) => setAccessToken(event.target.value)}
					placeholder="Access Token 입력"
					style={{ width: 360, maxWidth: "100%", marginRight: 8 }}
				/>
				<button type="button" onClick={handleSendTokenToBackend}>
					토큰 서버 전송
				</button>
			</div>
			<p>FCM Token: {fcmToken ? `${fcmToken.slice(0, 20)}...` : "없음"}</p>
			<p>{status}</p>
		</div>
	);
};

export default FcmTestPage;
