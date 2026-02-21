import type { AuthResponse, LoginRequest, SignupRequest } from "@/utils/types/authTypes";
import api from "./axios";


export const signup = async (signupInput: SignupRequest) => {
	const response = await api.post<AuthResponse>("/auth/signup", signupInput);

    localStorage.setItem("accessToken", response.data.access_token);

    return response.data.user;
};

export const login = async (loginInput: LoginRequest) => {
    const response = await api.post<AuthResponse>("/auth/login", loginInput);

    localStorage.setItem("accessToken", response.data.access_token);
    
    return response.data.user;
}