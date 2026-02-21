import api from "./axios";
import type {
	HistoryListResponse,
	SessionHistoryResponse,
} from "../utils/types/sessionTypes";

export const getHistory = async (): Promise<SessionHistoryResponse> => {
	const res = await api.get<SessionHistoryResponse>("/history");
	return res.data;
};

export const getHistoryBySessionId = async (
	sessionId: number,
): Promise<SessionHistoryResponse> => {
	const res = await api.get<SessionHistoryResponse>(`/history/${sessionId}`);
	return res.data;
};

export const listHistory = async (): Promise<HistoryListResponse> => {
	const res = await api.get<HistoryListResponse>(`/history/list`);
	return res.data;
};
