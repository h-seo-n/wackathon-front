import api from "./axios";

export interface NotifyPartnerResponse {
	messageId: string;
}

export const notifyPartnerLocationShare = async () => {
	const baseUrl = api.defaults.baseURL ?? "";
	console.log(`[noti] ${baseUrl}/noti/partner 요청`);
	try {
		const res = await api.post<NotifyPartnerResponse>("/noti/partner");
		console.log(`[noti] partner notify 성공 status=${res.status}`, res.data);
		return res;
	} catch (error) {
		console.error("[noti] partner notify 실패", error);
		throw error;
	}
};
