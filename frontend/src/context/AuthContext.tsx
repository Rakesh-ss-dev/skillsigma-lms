import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

interface User {
    id: number;
    username: string;
    role: "admin" | "instructor" | "student";
}

interface AuthContextType {
    user: User | null;
    access: string | null;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string, role: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(() => {
        try {
            const stored = localStorage.getItem("user");
            if (!stored || stored === "undefined") return null; // safeguard
            return JSON.parse(stored) as User;
        } catch {
            return null; // fallback if JSON is corrupted
        }
    });
    const [access, setAccess] = useState<string | null>(
        localStorage.getItem("access")
    );

    // ✅ verify token on load
    useEffect(() => {
        if (access) {
            API.post("/auth/token/verify/", { token: access }).catch(() => {
                console.warn("Access token expired or invalid, logging out");
                logout();
            });
        }
    }, [access]);

    // ✅ login
    const login = async (username: string, password: string) => {
        const res = await API.post("/auth/login/", { username, password });

        localStorage.setItem("access", res.data.access);
        localStorage.setItem("refresh", res.data.refresh);

        setAccess(res.data.access);

        // decode JWT payload
        const payload = JSON.parse(atob(res.data.access.split(".")[1]));

        const newUser: User = {
            id: payload.user_id,
            username: payload.username,
            role: payload.role,
        };

        setUser(newUser);
        localStorage.setItem("user", JSON.stringify(newUser)); // ✅ persist user

        navigate(`/${payload.role}-dashboard`);
    };

    // ✅ register
    const register = async (
        username: string,
        password: string,
        role: string
    ) => {
        await API.post("/auth/register/", { username, password, role });
        navigate("/login", { replace: true });
    };

    // ✅ logout
    const logout = async () => {
        try {
            await API.post("/auth/logout/", {
                refresh: localStorage.getItem("refresh"),
            });
        } catch (err) {
            console.error("Logout error:", err);
        }

        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");

        setAccess(null);
        setUser(null);

        navigate("/login", { replace: true });
    };

    return (
        <AuthContext.Provider value={{ user, access, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};
