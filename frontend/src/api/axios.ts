// src/api/axios.ts
import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

const API = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- QUEUE VARIABLES FOR SIMULTANEOUS 401 HANDSHAKES ---
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

// 1. Request Interceptor: Attach Access Token
API.interceptors.request.use(
  (config) => {
    const access = localStorage.getItem("access");
    if (access) {
      config.headers.Authorization = `Bearer ${access}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Handle 401 Errors (Token Expiration)
API.interceptors.response.use(
  (response) => response, 
  async (error) => {
    const originalRequest = error.config;

    // Guard: Check if error is 401 and we aren't already looping on this specific request
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // If a refresh is already happening, block this request and queue it up
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return API(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true; 
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refresh");

        if (!refreshToken) {
          throw new Error("No refresh token stored");
        }

        // 1. Execute exactly ONE request to the refresh token endpoint
        const response = await axios.post(`${baseURL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;
        const newRefreshToken = response.data.refresh; // Captured if backend rotates refresh tokens

        // 2. Save the new access token securely
        localStorage.setItem("access", newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem("refresh", newRefreshToken);
        }

        // 3. Set standard defaults for subsequent outgoing app requests
        API.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // 4. Release all pending requests in the queue with the new access token
        processQueue(null, newAccessToken);
        
        // 5. Retry our initial original failed request
        return API(originalRequest);

      } catch (refreshError) {
        // If the refresh token exchange itself fails, clear the tracking queues and log out
        processQueue(refreshError, null);
        console.error("Session expired. logging out...");
        
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        
        window.location.href = "/signin";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;