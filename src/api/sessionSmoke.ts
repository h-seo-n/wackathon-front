import api from "./axios";

// POST /sessions -> sessionId(id) 반환
export async function createSession(): Promise<number> {
  const res = await api.post(`/sessions`);
  const data = res.data;

  const sessionId =
    (typeof data === "number" && data) ||
    data?.id;

  if (!sessionId) {
    throw new Error(`createSession unexpected: ${JSON.stringify(data)}`);
  }
  return Number(sessionId);
}

// POST /sessions/{sessionId}/accept
export async function acceptSession(sessionId: number): Promise<void> {
  await api.post(`/sessions/${sessionId}/accept`);
}

// 추가: GET /sessions/{id}
export async function getSession(sessionId: number): Promise<any> {
  const res = await api.get(`/sessions/${sessionId}/status`);
  return res.data;
}