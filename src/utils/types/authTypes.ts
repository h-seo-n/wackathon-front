export interface User {
	id: number;
	email: string;
	nickname: string;
	profileImageUrl: string;
}

export interface authToken {
	access_token: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface SignupRequest extends LoginRequest {
	nickname: string;
}

export interface AuthResponse extends authToken {
	user: User;
}
