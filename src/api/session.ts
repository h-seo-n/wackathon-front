import api from "./axios";
import type { SessionHistoryResponse, SessionStatus } from "../utils/types/sessionTypes";

export async function getSessionStatus(sessionId: number) {
	const res = await api.get<{ status: SessionStatus }>(
		`/sessions/${sessionId}/status`,
	);
	return res.data;
}

export async function getSessionHistory(sessionId: number) {
	const res = await api.get<SessionHistoryResponse>(
		`/sessions/${sessionId}/history`,
	);
	return res.data;
}

export async function finishSession(sessionId: number) {
	const res = await api.post(`/sessions/${sessionId}/finish`);
	return res.data;
}

// 사진 업로드: /sessions/{session_id}/photo (POST)
export async function uploadSessionPhoto(
	sessionId: number,
	file: File,
	text?: string,
) {
	const form = new FormData();
	form.append("photo", file);
	if (text) form.append("text", text);

	const res = await api.post(`/sessions/${sessionId}/photo`, form, {
		headers: { "Content-Type": "multipart/form-data" },
	});
	return res.data;
}
