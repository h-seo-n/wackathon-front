// src/mocks/data.ts
export type HistoryPoint = {
  lat: number;
  lng: number;
  /** ms timestamp */
  t: number;
  /** optional: who generated the point */
  actor?: "me" | "partner";
};

export type SessionHistoryResponse = {
  sessionId: number;
  points: HistoryPoint[];
};

function nowMinus(minutes: number) {
  return Date.now() - minutes * 60 * 1000;
}

// 서울 어딘가를 걷는 듯한 경로 더미
export const SESSION_HISTORY: Record<number, SessionHistoryResponse> = {
  1: {
    sessionId: 1,
    points: [
      { lat: 37.5665, lng: 126.9780, t: nowMinus(40), actor: "me" },
      { lat: 37.5659, lng: 126.9772, t: nowMinus(35), actor: "me" },
      { lat: 37.5653, lng: 126.9763, t: nowMinus(30), actor: "partner" },
      { lat: 37.5647, lng: 126.9752, t: nowMinus(25), actor: "partner" },
      { lat: 37.5640, lng: 126.9741, t: nowMinus(20), actor: "me" },
      { lat: 37.5634, lng: 126.9733, t: nowMinus(15), actor: "me" },
      { lat: 37.5629, lng: 126.9726, t: nowMinus(10), actor: "partner" },
      { lat: 37.5624, lng: 126.9720, t: nowMinus(5), actor: "partner" },
    ],
  },
  2: {
    sessionId: 2,
    points: [
      { lat: 37.5700, lng: 126.9830, t: nowMinus(25), actor: "me" },
      { lat: 37.5694, lng: 126.9822, t: nowMinus(18), actor: "partner" },
      { lat: 37.5686, lng: 126.9814, t: nowMinus(12), actor: "me" },
      { lat: 37.5678, lng: 126.9805, t: nowMinus(6), actor: "partner" },
    ],
  },
};

export function listHistoryByDateParam(dateParam: string): SessionHistoryResponse[] {
  // dateParam(YYYYMMDD / YYYYMM / YYYY)로 필터링하는 척만 하고,
  // 지금은 더미니까 간단히 반환.
  // 나중에 실제로 하고 싶으면 session에 date를 붙여서 여기서 걸러주면 됨.
  void dateParam;
  return Object.values(SESSION_HISTORY);
}