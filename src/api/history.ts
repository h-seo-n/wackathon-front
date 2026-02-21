import api from "./axios";
import type { SessionHistoryResponse, SessionStatus } from "../utils/types";

export const getHistoryBySessionId = async (
    sessionId: number
): Promise<SessionHistoryResponse> => {
    const res = await api.get<SessionHistoryResponse>(`/history/${sessionId}`);
    return res.data;
};

export const listHistory = async (params: {
    date: string; //YYYYMMDD / YYYYMM / YYYY
}): Promise<SessionHistoryResponse[]> => {
    const res = await api.get<SessionHistoryResponse[]>(`/history/list`, { params });
    return res.data;
}