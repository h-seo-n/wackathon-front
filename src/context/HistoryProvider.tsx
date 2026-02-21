import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
	type ReactNode,
} from "react";

import type {
	HistoryListResponse,
	SessionHistoryResponse,
} from "../utils/types/sessionTypes";

import { getHistory, getHistoryBySessionId, listHistory } from "../api/history";

type HistoryListItem = HistoryListResponse["historyList"][number];

type HistoryContextValue = {
	// data
	globalHistory: SessionHistoryResponse | null; // GET /api/history
	history: SessionHistoryResponse | null; // GET /history/{sessionId}
	histories: HistoryListItem[]; // GET /history/list

	// state
	isLoadingGlobalHistory: boolean;
	isLoadingHistory: boolean;
	isLoadingHistories: boolean;
	error: string | null;

	// actions
	fetchGlobalHistory: () => Promise<SessionHistoryResponse>;
	fetchHistoryBySessionId: (
		sessionId: number,
	) => Promise<SessionHistoryResponse>;
	fetchHistories: () => Promise<HistoryListResponse>;

	clearGlobalHistory: () => void;
	clearHistory: () => void;
	clearHistories: () => void;
	clearError: () => void;
};

const HistoryContext = createContext<HistoryContextValue | undefined>(
	undefined,
);

export function HistoryProvider({ children }: { children: ReactNode }) {
	const [globalHistory, setGlobalHistory] =
		useState<SessionHistoryResponse | null>(null);
	const [history, setHistory] = useState<SessionHistoryResponse | null>(null);
	const [histories, setHistories] = useState<HistoryListItem[]>([]);

	const [isLoadingGlobalHistory, setIsLoadingGlobalHistory] = useState(false);
	const [isLoadingHistory, setIsLoadingHistory] = useState(false);
	const [isLoadingHistories, setIsLoadingHistories] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const clearError = useCallback(() => setError(null), []);
	const clearGlobalHistory = useCallback(() => setGlobalHistory(null), []);
	const clearHistory = useCallback(() => setHistory(null), []);
	const clearHistories = useCallback(() => setHistories([]), []);

	// 1) GET /api/history
	const fetchGlobalHistory = useCallback(async () => {
		setIsLoadingGlobalHistory(true);
		setError(null);
		try {
			const data = await getHistory();
			setGlobalHistory(data);
			return data;
		} catch (e: any) {
			const message =
				e?.response?.data?.message ||
				e?.message ||
				"전체 히스토리를 불러오지 못했습니다.";
			setError(message);
			throw e;
		} finally {
			setIsLoadingGlobalHistory(false);
		}
	}, []);

	// 2) GET /history/{sessionId}
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

	// 3) GET /history/list
	const fetchHistories = useCallback(async () => {
		setIsLoadingHistories(true);
		setError(null);
		try {
			const data = await listHistory();
			setHistories(data.historyList ?? []);
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
			globalHistory,
			history,
			histories,

			isLoadingGlobalHistory,
			isLoadingHistory,
			isLoadingHistories,
			error,

			fetchGlobalHistory,
			fetchHistoryBySessionId,
			fetchHistories,

			clearGlobalHistory,
			clearHistory,
			clearHistories,
			clearError,
		}),
		[
			globalHistory,
			history,
			histories,
			isLoadingGlobalHistory,
			isLoadingHistory,
			isLoadingHistories,
			error,
			fetchGlobalHistory,
			fetchHistoryBySessionId,
			fetchHistories,
			clearGlobalHistory,
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
	if (!ctx) throw new Error("useHistory must be used within a HistoryProvider");
	return ctx;
}
