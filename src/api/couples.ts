import api from "./axios";

export interface InviteResponse {
    id: number;
    inviterUserId: number;
    code: string;
    expiresAt: string;
    usedAt: string | null;
    createdAt: string;
}

export const createInviteCode = () =>
    api.post<InviteResponse>("/couples/invite-code");

export const joinInviteCode = (code: string) =>
    api.post<InviteResponse>("/couples/join", { code });
