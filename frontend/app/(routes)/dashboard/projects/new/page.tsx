"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default function NewProjectPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const { user: userData } = await getCurrentUser();
        if (userData.ownedTeam) {
          setTeamId(userData.ownedTeam.id);
        }
      } catch (error) {
        console.error("Failed to fetch team:", error);
      }
    };

    if (user) {
      fetchTeam();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post("/projects", {
        name,
        description: description || undefined,
        // teamId is optional - backend will create a team automatically if user doesn't have one
        ...(teamId && { teamId }),
      });

      // Refresh user data to get updated team info
      await refreshUser();

      router.push("/dashboard");
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Nie udało się utworzyć projektu";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Nowy projekt</h1>
          <p className="text-muted-foreground">
            {teamId 
              ? "Utwórz nowy projekt dla swojego teamu"
              : "Utwórz nowy projekt. Jeśli nie masz teamu, zostanie on utworzony automatycznie."}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Szczegóły projektu</CardTitle>
            <CardDescription>
              Wypełnij formularz, aby utworzyć nowy projekt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Nazwa projektu *
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nazwa projektu"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Opis
                </label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Opis projektu (opcjonalnie)"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Tworzenie..." : "Utwórz projekt"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Anuluj
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

