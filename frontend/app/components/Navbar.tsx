"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Hide navbar on dashboard pages
  if (pathname?.startsWith("/dashboard")) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold">
            TaskMaster 🧩
          </Link>

          <div className="flex items-center gap-4">
            {!loading && user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {user.name || user.email}
                </span>
                <Link
                  href="/dashboard"
                  className="text-sm text-primary hover:underline"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm text-primary hover:underline"
                >
                  Wyloguj
                </button>
              </>
            ) : !loading ? (
              <>
                <Link
                  href="/login"
                  className="text-sm text-primary hover:underline"
                >
                  Zaloguj się
                </Link>
                <Link
                  href="/register"
                  className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90"
                >
                  Zarejestruj się
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
