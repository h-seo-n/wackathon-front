export type SessionStatus = "ACTIVE" | "FINISHED";

export type SessionPointType = "LOCATION" | "PHOTO" | "TEXT" | "MEET"; 

export type SessionPoint = {
  id: number;
  session_id: number;
  user_id: number;
  type: SessionPointType;
  created_at: string; // ISO
  lat: number | null;
  lng: number | null;
  photo_path?: string | null;
  text?: string | null;
};

export type SessionHistoryResponse = {
  sessionId: number;
  points: SessionPoint[];
};

export type LatLng = { lat: number; lng: number };

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
};