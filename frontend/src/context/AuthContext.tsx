// src/context/AuthProvider.tsx
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
import axios from "axios";

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
  refreshAccessToken: () => Promise<string | null>; // Exposed for WebSockets
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
    localStorage.getItem("access"),
  );

  const getUserEndpoint = (role: string) => {
    switch (role) {
      case "admin":
        return "/admin/";
      case "instructor":
        return "/instructor/";
      case "student":
      default:
        return "/user/";
    }
  };
  let isRefreshingToken = false;
  let refreshSubscribers: ((token: string) => void)[] = [];

  // Helper function to push waiting requests into a queue
  const subscribeTokenRefresh = (cb: (token: string) => void) => {
    refreshSubscribers.push(cb);
  };

  // Helper function to flush the queue once the new token arrives
  const onRefreshed = (token: string) => {
    refreshSubscribers.map((cb) => cb(token));
    refreshSubscribers = [];
  };
  // ------------------ Refresh token logic ------------------
  const refreshAccessToken = async (): Promise<string | null> => {
    // If a refresh operation is already running, return a promise that resolves
    // when the running operation finishes
    if (isRefreshingToken) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((token: string) => {
          resolve(token);
        });
      });
    }

    try {
      const refresh = localStorage.getItem("refresh");
      if (!refresh) throw new Error("No refresh token available");

      isRefreshingToken = true;
      console.log("🔒 Lock engaged: Silently refreshing tokens...");

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/token/refresh/`,
        { refresh },
      );

      const newAccess = res.data.access;
      localStorage.setItem("access", newAccess);
      setAccess(newAccess);

      if (res.data.refresh) {
        localStorage.setItem("refresh", res.data.refresh);
      }

      const payload: JWTPayload = jwtDecode(newAccess);
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

      API.defaults.headers.common["Authorization"] = `Bearer ${newAccess}`;

      // Notify all waiting background execution loops that the new token is ready
      onRefreshed(newAccess);
      isRefreshingToken = false; // Release lock

      return newAccess;
    } catch (err) {
      console.error("Critical: Refresh token cycle failed. Purging state.");
      isRefreshingToken = false; // Release lock on failure
      localLogout();
      return null;
    }
  };

  // ------------------ Silent Client Check On Mount ------------------
  useEffect(() => {
    const verifySessionOnMount = async () => {
      if (access) {
        try {
          // Check if current token payload is physically expired before hitting network
          const payload: JWTPayload = jwtDecode(access);
          const isExpired = payload.exp * 1000 < Date.now();

          if (isExpired) {
            console.log("Token expired on mount, refreshing...");
            await refreshAccessToken();
          } else {
            API.defaults.headers.common["Authorization"] = `Bearer ${access}`;
          }
        } catch {
          await refreshAccessToken();
        }
      }
    };
    verifySessionOnMount();
  }, []); // Empty array! Run ONLY once when the app mounts, not on every state change.

  // ------------------ Axios interceptor for auto-refresh ------------------
  useEffect(() => {
    const interceptor = API.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config as any;
        const isAuthRequest = originalRequest.url?.includes("/auth/");

        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !isAuthRequest
        ) {
          originalRequest._retry = true;

          // If a refresh loop is running elsewhere, pause this request and queue it
          if (isRefreshingToken) {
            return new Promise((resolve) => {
              subscribeTokenRefresh((token: string) => {
                originalRequest.headers["Authorization"] = `Bearer ${token}`;
                resolve(API(originalRequest));
              });
            });
          }

          // Otherwise, trigger the refresh operation safely
          const newAccess = await refreshAccessToken();
          if (newAccess) {
            originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;
            return API(originalRequest);
          }
        }
        return Promise.reject(error);
      },
    );

    return () => {
      API.interceptors.response.eject(interceptor);
    };
  }, []);

  // ------------------ Login ------------------
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

      API.defaults.headers.common["Authorization"] =
        `Bearer ${res.data.access}`;

      toast.success("Logged in successfully");

      if (newUser.role === "student") {
        navigate(`/me/`);
      } else {
        navigate(`/`);
      }
    } catch (err) {
      toast.error("The credentials didn't match");
    }
  };

  // ------------------ Register ------------------
  const register = async (username: string, password: string, role: string) => {
    await API.post("/auth/register/", { username, password, role });
    navigate("/signin", { replace: true });
  };

  // ------------------ Local Logout State Purge ------------------
  const localLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    delete API.defaults.headers.common["Authorization"];
    setAccess(null);
    setUser(null);
    navigate("/signin", { replace: true });
  };

  // ------------------ Full Server Logout ------------------
  const logout = async () => {
    try {
      const currentRefresh = localStorage.getItem("refresh");
      if (currentRefresh) {
        await API.post("/auth/logout/", { refresh: currentRefresh });
      }
      toast.success("Logged Out Successfully");
    } catch (err) {
      console.error("Logout error from server:", err);
    } finally {
      localLogout();
    }
  };

  // ------------------ Update profile ------------------
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

    const endpoint = getUserEndpoint(user.role);
    const url = `${endpoint}${user.id}/`;
    const res = await API.patch(url, payload, { headers });
    const updatedUser: User = res.data;
    if (user.id == updatedUser.id) {
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }

    return updatedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        access,
        login,
        register,
        logout,
        refreshAccessToken,
        updateUserProfile,
      }}
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
