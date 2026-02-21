import { useRef, useState } from "react";
import {
	createSession,
	acceptSession,
	getSession,
} from "../../api/sessionSmoke";
import { openSessionWs, type WsPayload } from "../../ws/sessionWs";
import { TokenService } from "../../api/tokenService";

// ✅ 하드코딩 토큰 2개
const TOKENS = {
	user1:
		"eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwiaWF0IjoxNzcxNjgzMjkwLCJleHAiOjM1NDM0NTEyODIsInR5cCI6ImFjY2VzcyJ9.PLcvH9gRvQa9pdBQ0syY0kMDZKAr2XTF9wJvxKzZoXA",
	user2:
		"eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0MiIsImlhdCI6MTc3MTY4MzQwMywiZXhwIjozNTQzNDUxMzk1LCJ0eXAiOiJhY2Nlc3MifQ.pUywbPyzQoEZir_HohBO4KyEiAdeBRbK3hbmH_js3Lw",
} as const;

type UserKey = keyof typeof TOKENS;

export default function WsSmokeTestPage() {
	const [who, setWho] = useState<UserKey>("user1");
	const [sessionId, setSessionId] = useState<number | "">("");
	const [log, setLog] = useState<string[]>([]);
	const wsRef = useRef<ReturnType<typeof openSessionWs> | null>(null);

	const push = (s: string) =>
		setLog((p) => [`${new Date().toLocaleTimeString()}  ${s}`, ...p]);

	const connect = (sid: number) => {
		wsRef.current?.close();

		const token = TOKENS[who];
		wsRef.current = openSessionWs(sid, token, {
			onOpen: () => push(`WS OPEN ✅ (${who}) ${wsRef.current?.url}`),
			onClose: (e) => push(`WS CLOSE code=${e.code} reason=${e.reason || ""}`),
			onError: () => push(`WS ERROR ❌ (check token/url/cors)`),
			onMessage: (d) =>
				push(`WS <- ${typeof d === "string" ? d : JSON.stringify(d)}`),
		});
	};

	// ✅ 2번: 세션 생성 -> WS 자동 시작
	const onCreateAndConnect = async () => {
		TokenService.setToken(TOKENS[who]);
		const sid = await createSession();
		setSessionId(sid);
		push(`created sessionId=${sid}`);
		connect(sid);
	};

	// ✅ 3번: 세션 수락 -> WS 자동 시작
	const onAcceptAndConnect = async () => {
		if (sessionId === "" || !Number(sessionId))
			return push("set sessionId first");
		TokenService.setToken(TOKENS[who]);
		const sid = Number(sessionId);
		await acceptSession(sid);
		push(`accepted sessionId=${sid}`);
		connect(sid);
	};

	// 간단 송신 (POINT)
	const sendPoint = () => {
		if (!wsRef.current) return push("no ws connected");
		if (sessionId === "" || !Number(sessionId)) return push("no sessionId");
		const payload: WsPayload = {
			type: "POINT",
			lat: 37.1,
			lng: 127.1,
			ts: Date.now(),
			text: "smoke",
		};
		wsRef.current.send(payload);
		push(`WS -> ${JSON.stringify(payload)}`);
	};

	const sendCancel = () => {
		if (!wsRef.current) return push("no ws connected");
		const payload: WsPayload = { type: "CANCEL", ts: Date.now() };
		wsRef.current.send(payload);
		push(`WS -> ${JSON.stringify(payload)}`);
	};

	const closeWs = () => {
		wsRef.current?.close();
		wsRef.current = null;
		push("client close()");
	};

	const onCheckStatus = async () => {
		if (sessionId === "" || !Number(sessionId))
			return push("set sessionId first");
		TokenService.setToken(TOKENS[who]);

		const sid = Number(sessionId);
		const s = await getSession(sid);

		// 보기 좋게 핵심만
		push(
			`status: id=${s.id} status=${s.status} requestUserId=${s.requestUserId} startAt=${s.startAt ?? "null"} endAt=${
				s.endAt ?? "null"
			}`,
		);
	};

	return (
		<div style={{ padding: 16, maxWidth: 960 }}>
			<h2>WS Smoke Test (hardcoded ws + hardcoded tokens)</h2>

			<div
				style={{
					display: "flex",
					gap: 8,
					alignItems: "center",
					marginBottom: 12,
					flexWrap: "wrap",
				}}
			>
				<label style={{ display: "flex", gap: 6, alignItems: "center" }}>
					user:
					<select
						value={who}
						onChange={(e) => setWho(e.target.value as UserKey)}
					>
						<option value="user1">user1 (test)</option>
						<option value="user2">user2 (test2)</option>
					</select>
				</label>

				<button onClick={onCreateAndConnect}>
					2) Create session + WS connect
				</button>

				<input
					value={sessionId}
					onChange={(e) =>
						setSessionId(e.target.value === "" ? "" : Number(e.target.value))
					}
					placeholder="sessionId"
					style={{ width: 140 }}
				/>

				<button onClick={onAcceptAndConnect}>
					3) Accept session + WS connect
				</button>

				<button onClick={onCheckStatus}>Check status</button>
				<button onClick={sendPoint}>Send POINT</button>
				<button onClick={sendCancel}>Send CANCEL</button>
				<button onClick={closeWs}>Close WS</button>
			</div>

			<div
				style={{
					border: "1px solid #ddd",
					borderRadius: 8,
					padding: 12,
					height: 380,
					overflow: "auto",
				}}
			>
				{log.map((l, i) => (
					<div
						key={i}
						style={{
							fontFamily: "monospace",
							fontSize: 12,
							whiteSpace: "pre-wrap",
						}}
					>
						{l}
					</div>
				))}
			</div>

			<div style={{ marginTop: 10, fontSize: 12, color: "#555" }}>
				WS URL 포맷:{" "}
				<code>
					wss://waffle-project-dev-server.xyz/ws/session?sessionId=...&token=...
				</code>
			</div>
		</div>
	);
}
