import { api } from "./api";

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  message: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
  message: string;
}

export interface AuthError {
  error: string;
  message: string;
}

// Login user
export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/auth/login", {
    email,
    password,
  });
  return response.data;
}

// Register user
export async function register(
  email: string,
  password: string,
  name?: string
): Promise<RegisterResponse> {
  const response = await api.post<RegisterResponse>("/auth/register", {
    email,
    password,
    name,
  });
  return response.data;
}

// Get current user
export async function getCurrentUser(): Promise<{ user: User & { ownedTeam?: any; teamRoles?: any[] } }> {
  const response = await api.get<{ user: User & { ownedTeam?: any; teamRoles?: any[] } }>("/auth/me");
  return response.data;
}

// Store auth data in cookies and localStorage (for sync with server)
export function setAuthData(token: string, user: User): void {
  if (typeof window !== "undefined") {
    // Store in localStorage for client-side access
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    
    // Store in cookie for server-side middleware
    document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`; // 7 days
  }
}

// Get auth data from localStorage (client-side) or cookies
export function getAuthData(): { token: string | null; user: User | null } {
  if (typeof window !== "undefined") {
    // Try localStorage first (faster)
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    
    if (token && userStr) {
      const user = JSON.parse(userStr);
      return { token, user };
    }
    
    // Fallback to cookies
    const cookies = document.cookie.split(";");
    const tokenCookie = cookies.find((c) => c.trim().startsWith("token="));
    if (tokenCookie) {
      const tokenValue = tokenCookie.split("=")[1];
      return { token: tokenValue, user: null };
    }
  }
  return { token: null, user: null };
}

// Clear auth data from both localStorage and cookies
export function clearAuthData(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    // Clear cookie
    document.cookie = "token=; path=/; max-age=0";
  }
}
