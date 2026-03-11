// src/api/axios.ts
import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

const API = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

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
  (response) => response, // If response is good, just return it
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 (Unauthorized) and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark this request so we don't loop infinitely

      try {
        const refreshToken = localStorage.getItem("refresh");

        // If no refresh token is available, we must log out
        if (!refreshToken) {
            throw new Error("No refresh token stored");
        }

        // Attempt to get a new access token
        // We use 'axios' directly here to avoid using our interceptors on this call
        const response = await axios.post(`${baseURL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;

        // Save the new token
        localStorage.setItem("access", newAccessToken);

        // Update the header of the failed request with the new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Retry the original request
        return API(originalRequest);

      } catch (refreshError) {
        // If the REFRESH token is also expired (server returns 401 on refresh)
        // or if network fails, we must force logout.
        console.error("Session expired. logging out...");
        
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        
        // Force redirect to login page
        // Since we are not in a React component, we use window.location
        window.location.href = "/signin";
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default API;