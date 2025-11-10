"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

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
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {user.name || user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Wyloguj
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Zaloguj się
                </Link>
                <Link
                  href="/register"
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Zarejestruj się
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

