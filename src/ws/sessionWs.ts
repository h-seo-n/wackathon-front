export type WsPayload =
  | { type: "POINT"; lat: number; lng: number; ts: number; text?: string; photoPath?: string }
  | { type: "MEET_CONFIRM"; lat: number; lng: number; ts: number }
  | { type: "CANCEL"; ts: number };

type Handlers = {
  onOpen?: () => void;
  onClose?: (e: CloseEvent) => void;
  onError?: (e: Event) => void;
  onMessage?: (data: any) => void;
};

// 하드코딩 웹소켓 베이스
// 백엔드 포맷: wss://waffle-project-dev-server.xyz/ws/session?sessionId=123&token=<JWT>
const WS_BASE = "wss://waffle-project-dev-server.xyz/ws/session";

export function openSessionWs(sessionId: number, token: string, handlers: Handlers = {}) {
  const url = `${WS_BASE}?sessionId=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(token)}`;

  const ws = new WebSocket(url);

  ws.onopen = () => handlers.onOpen?.();
  ws.onclose = (e) => handlers.onClose?.(e);
  ws.onerror = (e) => handlers.onError?.(e);
  ws.onmessage = (e) => {
    try {
      handlers.onMessage?.(JSON.parse(e.data));
    } catch {
      handlers.onMessage?.(e.data);
    }
  };

  const send = (payload: WsPayload) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(payload));
  };

  const close = () => ws.close(1000, "client_close");

  return { ws, send, close, url };
}