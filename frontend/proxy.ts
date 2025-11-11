import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/teams", "/projects"];

// Routes that should redirect to home if already authenticated
const authRoutes = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing auth routes with valid token, redirect to home
  if (isAuthRoute && token) {
    // Verify token is still valid
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch {
      // Token invalid, clear cookie and allow access to auth page
      const response = NextResponse.next();
      response.cookies.delete("token");
      return response;
    }
  }

  // If accessing protected route with token, verify it's valid
  if (isProtectedRoute && token) {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Token invalid, redirect to login
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        const nextResponse = NextResponse.redirect(loginUrl);
        nextResponse.cookies.delete("token");
        return nextResponse;
      }
    } catch {
      // Network error, redirect to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const nextResponse = NextResponse.redirect(loginUrl);
      nextResponse.cookies.delete("token");
      return nextResponse;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
