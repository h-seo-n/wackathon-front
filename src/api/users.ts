import type { User } from "@/utils/types/authTypes";
import api from "./axios";

export const uploadProfileImg = async (file: File) => {
	const fd = new FormData();
	fd.append("file", file);

	const { data } = await api.post<{ profileImageUrl: string }>(
		"/users/me/profile-image",
		fd,
	);

	return data;
};

export const getUser = async () => {
    const response = await api.get<User>('/users/me');
    return response.data;
}