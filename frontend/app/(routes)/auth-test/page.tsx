"use client";

import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";

export default function TestPage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Test Autentykacji</h1>

          <Card>
            <CardHeader>
              <CardTitle>Status logowania</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user ? (
                <div className="space-y-4">
                  <p className="text-green-500 dark:text-green-400">
                    ✅ Zalogowany
                  </p>
                  <div className="space-y-2">
                    <p>
                      <strong>ID:</strong> {user.id}
                    </p>
                    <p>
                      <strong>Email:</strong> {user.email}
                    </p>
                    <p>
                      <strong>Imię:</strong> {user.name || "Brak"}
                    </p>
                    <p>
                      <strong>Data rejestracji:</strong>{" "}
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button onClick={logout} variant="destructive">
                    Wyloguj
                  </Button>
                </div>
              ) : (
                <p className="text-destructive">❌ Nie zalogowany</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
