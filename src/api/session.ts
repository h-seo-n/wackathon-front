import api from "./axios";
import type {
	Session,
	SessionPoint,
	SessionStatusResponse,
	HistoryResponse,
	FinishSessionRequest,
} from "@/utils/types/sessionTypes";

export async function getSessionStatus(
	sessionId: number,
): Promise<SessionStatusResponse> {
	const res = await api.get<SessionStatusResponse>(
		`/sessions/${sessionId}/status`,
	);
	return res.data;
}

export async function getSessionHistory(
	sessionId: number,
): Promise<HistoryResponse> {
	const res = await api.get<HistoryResponse>(`/sessions/${sessionId}/history`);
	return res.data;
}

export async function createSession(): Promise<Session> {
	const res = await api.post<Session>("/sessions");
	return res.data;
}

export async function getSessions(): Promise<Session[]> {
	const res = await api.get<Session[]>("/sessions");
	return res.data;
}

export async function acceptSession(sessionId: number): Promise<Session> {
	const res = await api.post<Session>(`/sessions/${sessionId}/accept`);
	return res.data;
}

export async function finishSession(
	sessionId: number,
	body: FinishSessionRequest,
) {
	const res = await api.post(`/sessions/${sessionId}/finish`, body);
	return res.data;
}

export async function uploadSessionPhoto(
	sessionId: number,
	file: File,
	text?: string,
): Promise<SessionPoint> {
	const form = new FormData();
	form.append("photo", file);
	if (text) form.append("text", text);

	const res = await api.post<SessionPoint>(
		`/sessions/${sessionId}/photos`,
		form,
		// ❗ Content-Type 직접 지정하지 않음
	);

	return res.data;
}
