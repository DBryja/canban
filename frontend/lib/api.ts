import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // If no token in localStorage, try to get from cookies as fallback
      const cookies = document.cookie.split(";");
      const tokenCookie = cookies.find((c) => c.trim().startsWith("token="));
      if (tokenCookie) {
        const tokenValue = tokenCookie.split("=")[1];
        if (tokenValue) {
          config.headers.Authorization = `Bearer ${tokenValue}`;
        }
      }
    }
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      
      // Don't auto-redirect for these endpoints - let components handle errors
      const skipAutoRedirect = [
        "/auth/me",
        "/projects", // Let AppSidebar handle the error gracefully
      ];
      
      if (skipAutoRedirect.some((endpoint) => url.includes(endpoint))) {
        return Promise.reject(error);
      }
      
      // Token expired or invalid for other endpoints
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Only redirect if not already on login page
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

