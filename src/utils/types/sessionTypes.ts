export type SessionStatus = "PENDING" | "ACTIVE" | "DONE";

export type SessionEndReason = "MEET_CONFIRMED" | "TIMEOUT" | "MANUAL_CANCEL";

export type SessionPointType = "PHOTO" | "MEMO" | "MEET_DONE" | "POINT";

export type SessionPoint = {
	id: number;
	sessionId: number;
	userId: number;
	type: SessionPointType;
	createdAt: string; // ISO
	lat: number | null;
	lng: number | null;
	photoPath?: string | null;
	text?: string | null;
};

interface HistoryDto {
	id: number;
	date: string;
	travelMinutes: number;
	distance: number;
}

export interface HistoryListResponse {
	historyList: HistoryDto[];
}

export interface BasePointHistory {
	createdAt: string;
	lat: number;
	lng: number;
	phothPath: string;
	text: string;
}

export interface PhotoHistory extends BasePointHistory {
	type: "PHOTO";
	photoPath: string;
}

export interface MemoHistory extends BasePointHistory {
	type: "MEMO";
	text: string;
}

export interface MeetDoneHistory extends BasePointHistory {
	type: "MEET_DONE";
}

export interface PointHistory extends BasePointHistory {
	type: "POINT";
}

export type PointHistoryDto =
	| PhotoHistory
	| MemoHistory
	| MeetDoneHistory
	| PointHistory;

export interface SessionHistoryResponse {
	user1: PointHistoryDto[];
	user2: PointHistoryDto[];
}

export interface SessionPointResponse {
	pointHistoryList: PointHistoryDto[];
}

export type LatLng = { lat: number; lng: number };

export interface Session {
	id: number;
	coupleId: number;
	requestUserId: number;

	requestedAt: string; // ISO date-time
	status: SessionStatus;

	startAt: string | null; // ACTIVE 전에는 null 가능성 있음
	endAt: string | null;

	endReason: SessionEndReason | null;

	meetAt: string | null;
	meetLat: number | null;
	meetLng: number | null;
}

export interface SessionStatusResponse {
	sessionId: number;
	coupleId: number;
	requestUserId: number;

	status: SessionStatus;

	requestedAt: string; // ISO date-time
	startAt: string | null;
	endAt: string | null;

	endReason: SessionEndReason | null;

	meetAt: string | null;
	meetLat: number | null;
	meetLng: number | null;
}

export interface FinishSessionRequest {
	reason: SessionEndReason;
}

export type SessionState = {
	sessionId: number | null;
	status: SessionStatus | null;

	myPos: LatLng | null;
	partnerPos: LatLng | null;

	history: SessionPoint[];
	isWsConnected: boolean;

	// actions
	reloadHistory: () => Promise<void>;
	sendMyLocation: (pos: LatLng) => void;
	sendMeet: (pos: LatLng) => void;
	sendMeetAndFinish: (pos: LatLng) => Promise<void>;
	stopSharing: () => void;
	uploadPhotoAndBroadcast: (file: File, text?: string) => Promise<SessionPoint>;
	acceptAndStart: (sessionId: number) => Promise<void>;
	createAndStart: () => Promise<Session>;
	sendTextPoint: (text: string) => void;
	sendCancel: () => void;
};
