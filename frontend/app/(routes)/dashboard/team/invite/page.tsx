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

interface Invitation {
  id: string;
  token: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
  isValid: boolean;
}

export default function InviteUserPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const { user: userData } = await getCurrentUser();
        if (userData.ownedTeam) {
          setTeamId(userData.ownedTeam.id);
          fetchInvitations(userData.ownedTeam.id);
        }
      } catch (error) {
        console.error("Failed to fetch team:", error);
      }
    };

    if (user) {
      fetchTeam();
    }
  }, [user]);

  const fetchInvitations = async (teamId: string) => {
    setLoadingInvitations(true);
    try {
      const response = await api.get<{ invitations: Invitation[] }>(
        `/invitations/team/${teamId}`
      );
      setInvitations(response.data.invitations);
    } catch (error) {
      console.error("Failed to fetch invitations:", error);
    } finally {
      setLoadingInvitations(false);
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!teamId) {
      setError("Musisz być właścicielem teamu, aby zapraszać użytkowników");
      setLoading(false);
      return;
    }

    try {
      await api.post<{
        invitation: { token: string };
        invitationLink: string;
      }>("/invitations", {
        teamId,
        expiresInHours,
      });

      // Refresh invitations list
      if (teamId) {
        await fetchInvitations(teamId);
      }
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Nie udało się utworzyć zaproszenia";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyInvitationLink = (token: string) => {
    const link = `${window.location.origin}/invitations/${token}`;
    navigator.clipboard.writeText(link);
  };

  if (!teamId) {
    return (
      <ProtectedRoute>
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold">Zaproś użytkownika</h1>
            <p className="text-muted-foreground">
              Musisz być właścicielem teamu, aby zapraszać użytkowników
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Zaproś użytkownika</h1>
          <p className="text-muted-foreground">
            Utwórz link zaproszenia dla nowych członków teamu
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Utwórz zaproszenie</CardTitle>
            <CardDescription>
              Wygeneruj link zaproszenia, który możesz wysłać użytkownikom
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateInvitation} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="expiresInHours" className="text-sm font-medium">
                  Ważność (w godzinach)
                </label>
                <Input
                  id="expiresInHours"
                  type="number"
                  min="1"
                  max="168"
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(Number(e.target.value))}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Maksymalnie 168 godzin (7 dni)
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Tworzenie..." : "Utwórz zaproszenie"}
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

        <Card>
          <CardHeader>
            <CardTitle>Aktywne zaproszenia</CardTitle>
            <CardDescription>
              Lista wszystkich zaproszeń dla tego teamu
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingInvitations ? (
              <p className="text-sm text-muted-foreground">Ładowanie...</p>
            ) : invitations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Brak aktywnych zaproszeń
              </p>
            ) : (
              <div className="space-y-2">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {invitation.isValid ? "Aktywne" : "Nieaktywne"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Wygasa: {new Date(invitation.expiresAt).toLocaleString("pl-PL")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Utworzone: {new Date(invitation.createdAt).toLocaleString("pl-PL")}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyInvitationLink(invitation.token)}
                    >
                      Kopiuj link
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

