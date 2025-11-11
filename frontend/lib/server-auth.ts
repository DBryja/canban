import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

/**
 * Get current user from server-side (using cookies)
 * Returns null if not authenticated or token invalid
 */
export async function getServerUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store", // Always fetch fresh data
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error("Failed to verify token:", error);
    return null;
  }
}

/**
 * Check if user is authenticated on server-side
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getServerUser();
  return user !== null;
}
