"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";

interface Invitation {
  id: string;
  token: string;
  role: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
  isValid: boolean;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
}

export default function InviteUserPage() {
  const { user, fullUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projectId, setProjectId] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [role, setRole] = useState<"Guest" | "Maintainer">("Guest");
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  useEffect(() => {
    if (!user || !fullUser?.isAdmin) return;

    const fetchProjects = async () => {
      try {
        const response = await api.get<{ projects: Project[] }>("/projects");
        setProjects(response.data.projects);
        
        // Check if projectId is provided in query params
        const queryProjectId = searchParams.get("projectId");
        if (queryProjectId && response.data.projects.some(p => p.id === queryProjectId)) {
          setProjectId(queryProjectId);
        } else if (response.data.projects.length > 0 && !projectId) {
          setProjectId(response.data.projects[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      }
    };

    fetchProjects();
  }, [user, fullUser, searchParams]);

  useEffect(() => {
    if (!projectId) return;

    fetchInvitations(projectId);
  }, [projectId]);

  // Auto-refresh invitations when page becomes visible
  useEffect(() => {
    if (!projectId) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchInvitations(projectId);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Also set up interval to refresh every 30 seconds
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchInvitations(projectId);
      }
    }, 30000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [projectId]);

  const fetchInvitations = async (projectId: string) => {
    setLoadingInvitations(true);
    try {
      const response = await api.get<{ invitations: Invitation[] }>(
        `/invitations/project/${projectId}`
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

    if (!projectId) {
      setError("Musisz wybrać projekt");
      setLoading(false);
      return;
    }

    if (!fullUser?.isAdmin) {
      setError("Tylko administratorzy mogą tworzyć zaproszenia");
      setLoading(false);
      return;
    }

    try {
      await api.post<{
        invitation: { token: string };
        invitationLink: string;
      }>("/invitations", {
        projectId,
        role,
        expiresInHours,
      });

      // Refresh invitations list
      if (projectId) {
        await fetchInvitations(projectId);
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

  if (!fullUser?.isAdmin) {
    return (
      <ProtectedRoute>
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold">Zaproś użytkownika</h1>
            <p className="text-muted-foreground">
              Tylko administratorzy mogą zapraszać użytkowników do projektów
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
            Utwórz link zaproszenia dla nowych członków projektu
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
                <label htmlFor="project" className="text-sm font-medium">
                  Projekt *
                </label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz projekt" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium">
                  Rola *
                </label>
                <Select value={role} onValueChange={(value) => setRole(value as "Guest" | "Maintainer")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Guest">Gość (tylko przeglądanie)</SelectItem>
                    <SelectItem value="Maintainer">Maintainer (może edytować)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                <Button type="submit" disabled={loading || !projectId}>
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

        {projectId && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Aktywne zaproszenia</CardTitle>
                  <CardDescription>
                    Lista wszystkich zaproszeń dla tego projektu
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => projectId && fetchInvitations(projectId)}
                  disabled={loadingInvitations}
                >
                  {loadingInvitations ? "Odświeżanie..." : "Odśwież"}
                </Button>
              </div>
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
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        !invitation.isValid ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${
                            invitation.isValid ? "text-green-600" : "text-muted-foreground"
                          }`}>
                            {invitation.isValid ? "Aktywne" : invitation.used ? "Użyte" : "Wygasło"}
                          </p>
                          {invitation.used && (
                            <span className="text-xs text-muted-foreground">(użyte)</span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            ({invitation.role === "Guest" ? "Gość" : "Maintainer"})
                          </span>
                        </div>
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
                        disabled={!invitation.isValid}
                      >
                        Kopiuj link
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}
