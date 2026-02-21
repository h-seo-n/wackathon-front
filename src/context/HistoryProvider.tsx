import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
	type ReactNode,
} from "react";

import type { SessionHistoryResponse } from "../utils/types/sessionTypes";
import { getHistoryBySessionId, listHistory } from "../api/history";

/**
 * History Context Types
 */
type ListHistoryParams = {
	date: string; // YYYYMMDD / YYYYMM / YYYY
};

type HistoryContextValue = {
	// data
	history: SessionHistoryResponse | null;
	histories: SessionHistoryResponse[];

	// state
	isLoadingHistory: boolean;
	isLoadingHistories: boolean;
	error: string | null;

	// actions
	fetchHistoryBySessionId: (
		sessionId: number,
	) => Promise<SessionHistoryResponse>;
	fetchHistories: (
		params: ListHistoryParams,
	) => Promise<SessionHistoryResponse[]>;
	clearHistory: () => void;
	clearHistories: () => void;
	clearError: () => void;
};

const HistoryContext = createContext<HistoryContextValue | undefined>(
	undefined,
);

export function HistoryProvider({ children }: { children: ReactNode }) {
	const [history, setHistory] = useState<SessionHistoryResponse | null>(null);
	const [histories, setHistories] = useState<SessionHistoryResponse[]>([]);

	const [isLoadingHistory, setIsLoadingHistory] = useState(false);
	const [isLoadingHistories, setIsLoadingHistories] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const clearError = useCallback(() => setError(null), []);
	const clearHistory = useCallback(() => setHistory(null), []);
	const clearHistories = useCallback(() => setHistories([]), []);

	const fetchHistoryBySessionId = useCallback(async (sessionId: number) => {
		setIsLoadingHistory(true);
		setError(null);
		try {
			const data = await getHistoryBySessionId(sessionId);
			setHistory(data);
			return data;
		} catch (e: any) {
			const message =
				e?.response?.data?.message ||
				e?.message ||
				"세션 히스토리를 불러오지 못했습니다.";
			setError(message);
			throw e;
		} finally {
			setIsLoadingHistory(false);
		}
	}, []);

	const fetchHistories = useCallback(async (params: ListHistoryParams) => {
		setIsLoadingHistories(true);
		setError(null);
		try {
			const data = await listHistory(params);
			setHistories(data);
			return data;
		} catch (e: any) {
			const message =
				e?.response?.data?.message ||
				e?.message ||
				"히스토리 목록을 불러오지 못했습니다.";
			setError(message);
			throw e;
		} finally {
			setIsLoadingHistories(false);
		}
	}, []);

	const value = useMemo<HistoryContextValue>(
		() => ({
			history,
			histories,
			isLoadingHistory,
			isLoadingHistories,
			error,
			fetchHistoryBySessionId,
			fetchHistories,
			clearHistory,
			clearHistories,
			clearError,
		}),
		[
			history,
			histories,
			isLoadingHistory,
			isLoadingHistories,
			error,
			fetchHistoryBySessionId,
			fetchHistories,
			clearHistory,
			clearHistories,
			clearError,
		],
	);

	return (
		<HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>
	);
}

/**
 * Hook
 */
export function useHistory() {
	const ctx = useContext(HistoryContext);
	if (!ctx) {
		throw new Error("useHistory must be used within a HistoryProvider");
	}
	return ctx;
}
