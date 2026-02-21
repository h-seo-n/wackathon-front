import {
	createContext,
	useState,
	useEffect,
	type ReactNode,
	useContext,
} from "react";
import type {
	LoginRequest,
	SignupRequest,
	User,
} from "@/utils/types/authTypes";
import * as auth from "@/api/auth";
import { getUser, uploadProfileImg } from "@/api/users";

interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	login: (input: LoginRequest) => void;
	signup: (input: SignupRequest) => void;
	logout: () => void;
	setProfileImg: (
		file: File,
	) => Promise<{ profileImageUrl: string } | undefined>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const checkAuth = async () => {
			const token = localStorage.getItem("accessToken");
			if (!token) {
				setIsLoading(false);
				return;
			}
            
			try {
				const newUser = await getUser();
				setUser(newUser);
			} catch {
				localStorage.removeItem("accessToken");
				setUser(null);
			} finally {
				setIsLoading(false);
			}
		};
		checkAuth();
	}, []);

	/**
	 * Login Function
	 */
	const login = async (loginInput: LoginRequest) => {
		setIsLoading(true);
		try {
			const newUser = await auth.login(loginInput);
			setUser(newUser);
		} catch (err) {
			console.error("Login failed:", err);
			throw err;
		} finally {
			setIsLoading(false);
		}
	};


	/**
	 * Signup Function
	 */
	const signup = async (input: SignupRequest) => {
		setIsLoading(true);
		try {
			const userData = await auth.signup(input);
			setUser(userData);
		} catch (err) {
			console.error("Signup failed:", err);
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	const logout = () => {
		setUser(null);
		localStorage.removeItem("accessToken");
	};

	const setProfileImg = async (file: File) => {
		try {
			const url = await uploadProfileImg(file);
			const updatedUser = await getUser();
			setUser(updatedUser);

			return url;
		} catch (error) {
			console.error("server error at setting profile image", error);
		}
	};
	return (
		<AuthContext.Provider
			value={{
				user,
				isLoading,
				login,
				signup,
				logout,
				setProfileImg,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
};
