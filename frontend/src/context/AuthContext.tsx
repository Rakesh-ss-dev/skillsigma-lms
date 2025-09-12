import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";

interface User {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    name: string;
    role: "admin" | "instructor" | "student";
    avatar?: any;
    avatar_url?: string;
    phone?: string;
}

interface JWTPayload {
    user_id: number;
    username: string;
    role: "admin" | "instructor" | "student";
    email: string;
    first_name?: string;
    last_name?: string;
    name: string;
    avatar?: string;
    phone?: string;
    exp: number;
}

interface AuthContextType {
    user: User | null;
    access: string | null;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string, role: string) => Promise<void>;
    logout: () => void;
    updateUserProfile: (data: Partial<User>) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(() => {
        try {
            const stored = localStorage.getItem("user");
            if (!stored || stored === "undefined") return null;
            return JSON.parse(stored) as User;
        } catch {
            return null;
        }
    });
    const [access, setAccess] = useState<string | null>(
        localStorage.getItem("access")
    );

    // 🔄 refresh token logic
    const refreshAccessToken = async (): Promise<string | null> => {
        try {
            const res = await API.post("/auth/token/refresh/", {
                refresh: localStorage.getItem("refresh"),
            });

            localStorage.setItem("access", res.data.access);
            setAccess(res.data.access);
            localStorage.setItem('refresh', res.data.refresh);

            // decode payload & update user if needed
            const payload: JWTPayload = jwtDecode(res.data.access);
            const refreshedUser: User = {
                id: payload.user_id,
                username: payload.username,
                role: payload.role,
                email: payload.email,
                name: payload.name,
                first_name: payload.first_name,
                last_name: payload.last_name,
                avatar: payload.avatar,
                phone: payload.phone,
            };
            setUser(refreshedUser);
            localStorage.setItem("user", JSON.stringify(refreshedUser));

            return res.data.access;
        } catch (err) {
            console.warn("Refresh token failed:", err);
            logout();
            return null;
        }
    };

    // 🔒 verify token on load
    useEffect(() => {
        if (access) {
            API.post("/auth/token/verify/", { token: access }).catch(async () => {
                console.warn("Access expired, trying refresh...");
                await refreshAccessToken();
            });
        }
    }, [access]);

    // 🔄 Axios interceptor for auto-refresh on 401
    useEffect(() => {
        const interceptor = API.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    const newAccess = await refreshAccessToken();
                    if (newAccess) {
                        originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;
                        return API(originalRequest); // retry failed request
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            API.interceptors.response.eject(interceptor);
        };
    }, []);

    // ✅ login
    const login = async (username: string, password: string) => {
        try {
            const res = await API.post("/auth/login/", { username, password });
            localStorage.setItem("access", res.data.access);
            localStorage.setItem("refresh", res.data.refresh);
            setAccess(res.data.access);

            const payload: JWTPayload = jwtDecode(res.data.access);
            const newUser: User = {
                id: payload.user_id,
                username: payload.username,
                role: payload.role,
                email: payload.email,
                name: payload.name,
                first_name: payload.first_name,
                last_name: payload.last_name,
                avatar: payload.avatar,
                phone: payload.phone,
            };

            setUser(newUser);
            localStorage.setItem("user", JSON.stringify(newUser));

            toast.success("Logged in");
            navigate(`/`);
        } catch (err) {
            toast.error("The credentials didn't match");
        }
    };

    // ✅ register
    const register = async (
        username: string,
        password: string,
        role: string
    ) => {
        await API.post("/auth/register/", { username, password, role });
        navigate("/signin", { replace: true });
    };

    // ✅ logout
    const logout = async () => {
        try {
            await API.post("/auth/logout/", {
                refresh: localStorage.getItem("refresh"),
            });
            toast.success("Logged Out Successfully");
        } catch (err) {
            console.error("Logout error:", err);
            toast.error("Logout failed. Please try again.");
        }

        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");

        setAccess(null);
        setUser(null);

        navigate("/signin", { replace: true });
    };

    // ✅ update profile
    const updateUserProfile = async (data: Partial<User>): Promise<User> => {
        if (!user) throw new Error("No user logged in");

        let payload: any = data;
        let headers = {};

        if (data.avatar instanceof File) {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined) formData.append(key, value as any);
            });
            payload = formData;
            headers = { "Content-Type": "multipart/form-data" };
        }

        const res = await API.patch(`/users/${user.id}/`, payload, { headers });
        const updatedUser: User = res.data;
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        return updatedUser;
    };

    return (
        <AuthContext.Provider
            value={{ user, access, login, register, logout, updateUserProfile }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};
