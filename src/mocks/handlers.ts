// src/mocks/handlers.ts
import { http, HttpResponse, delay } from "msw";
import { SESSION_HISTORY, listHistoryByDateParam } from "./data";

export const handlers = [
	// GET /history/:sessionId
	http.get<{ sessionId: string }>("/history/:sessionId", async ({ params }) => {
		await delay(200);

		const sessionId = Number(params.sessionId);
		const data = SESSION_HISTORY[sessionId];

		if (!data) {
			return HttpResponse.json(
				{ message: "Session not found" },
				{ status: 404 },
			);
		}

		return HttpResponse.json(data);
	}),

	// GET /history/list?date=YYYYMMDD|YYYYMM|YYYY
	http.get("/history/list", async ({ request }) => {
		await delay(150);

		const url = new URL(request.url);
		const date = url.searchParams.get("date") ?? "YYYYMMDD";

		const list = listHistoryByDateParam(date);
		return HttpResponse.json(list);
	}),
];
