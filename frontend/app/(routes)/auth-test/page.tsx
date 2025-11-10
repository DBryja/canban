"use client";

import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function TestPage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Test Autentykacji</h1>
          
          <div className="bg-card rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Status logowania:</h2>
            
            {user ? (
              <div className="space-y-2">
                <p className="text-green-600">✅ Zalogowany</p>
                <div className="mt-4 space-y-2">
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Imię:</strong> {user.name || "Brak"}</p>
                  <p><strong>Data rejestracji:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={logout}
                  className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Wyloguj
                </button>
              </div>
            ) : (
              <p className="text-red-600">❌ Nie zalogowany</p>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

