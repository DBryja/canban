"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/app/components/ui/sheet";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { UserPlus, Trash2, RefreshCw, Copy } from "lucide-react";
import { useAppSidebar } from "@/app/components/AppSidebar/context";
import type { Project } from "@/app/components/AppSidebar/utils";

interface ProjectMember {
  id: string;
  role: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  createdAt: string;
}

interface Invitation {
  id: string;
  token: string;
  role: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
  isValid: boolean;
}

export default function ProjectManagePage() {
  const params = useParams();
  const router = useRouter();
  const { user, fullUser } = useAuth();
  const { findProjectBySlug } = useAppSidebar();
  const projectSlug = params["project-slug"] as string;

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<"Guest" | "Maintainer">("Guest");
  const [inviteExpiresInHours, setInviteExpiresInHours] = useState(24);
  const [creatingInvitation, setCreatingInvitation] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectSlug || !user || !fullUser?.isAdmin) {
      if (user && fullUser && !fullUser.isAdmin) {
        setError("Tylko administratorzy mogą zarządzać użytkownikami projektu");
        setLoading(false);
      }
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Find project by slug using utility from AppSidebar
        const foundProject = findProjectBySlug(projectSlug);

        if (!foundProject) {
          setError("Projekt nie został znaleziony");
          setLoading(false);
          return;
        }

        setProject(foundProject);

        // Fetch project members
        const membersResponse = await api.get<{ members: ProjectMember[] }>(
          `/projects/${foundProject.id}/members`
        );
        setMembers(membersResponse.data.members);

        // Fetch project invitations
        try {
          const invitationsResponse = await api.get<{
            invitations: Invitation[];
          }>(`/invitations/project/${foundProject.id}`);
          setInvitations(invitationsResponse.data.invitations);
        } catch (err) {
          console.error("Failed to fetch invitations:", err);
        }
      } catch (err: unknown) {
        const errorData = (
          err as { response?: { data?: { message?: string }; status?: number } }
        )?.response;
        if (errorData?.status === 403) {
          setError("Nie masz uprawnień do zarządzania tym projektem");
        } else if (errorData?.status === 404) {
          setError("Projekt nie został znaleziony");
        } else {
          setError("Nie udało się pobrać danych projektu");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectSlug, user, fullUser, findProjectBySlug]);

  const handleRoleChange = async (
    memberId: string,
    newRole: "Guest" | "Maintainer"
  ) => {
    if (!project) return;

    try {
      setUpdatingRole(memberId);
      await api.patch(`/projects/${project.id}/members/${memberId}`, {
        role: newRole,
      });

      // Refresh members list
      const membersResponse = await api.get<{ members: ProjectMember[] }>(
        `/projects/${project.id}/members`
      );
      setMembers(membersResponse.data.members);
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Nie udało się zaktualizować roli";
      alert(errorMessage);
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!project) return;

    if (!confirm("Czy na pewno chcesz usunąć tego użytkownika z projektu?")) {
      return;
    }

    try {
      setRemovingMember(memberId);
      await api.delete(`/projects/${project.id}/members/${memberId}`);

      // Refresh members list
      const membersResponse = await api.get<{ members: ProjectMember[] }>(
        `/projects/${project.id}/members`
      );
      setMembers(membersResponse.data.members);
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Nie udało się usunąć użytkownika";
      alert(errorMessage);
    } finally {
      setRemovingMember(null);
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    setInviteError(null);
    setCreatingInvitation(true);

    try {
      await api.post<{
        invitation: { token: string };
        invitationLink: string;
      }>("/invitations", {
        projectId: project.id,
        role: inviteRole,
        expiresInHours: inviteExpiresInHours,
      });

      // Refresh invitations list
      const invitationsResponse = await api.get<{ invitations: Invitation[] }>(
        `/invitations/project/${project.id}`
      );
      setInvitations(invitationsResponse.data.invitations);

      // Reset form and close modal
      setInviteRole("Guest");
      setInviteExpiresInHours(24);
      setIsInviteModalOpen(false);
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Nie udało się utworzyć zaproszenia";
      setInviteError(errorMessage);
    } finally {
      setCreatingInvitation(false);
    }
  };

  const handleRefresh = async () => {
    if (!project) return;

    try {
      setLoading(true);
      const membersResponse = await api.get<{ members: ProjectMember[] }>(
        `/projects/${project.id}/members`
      );
      setMembers(membersResponse.data.members);

      const invitationsResponse = await api.get<{ invitations: Invitation[] }>(
        `/invitations/project/${project.id}`
      );
      setInvitations(invitationsResponse.data.invitations);
    } catch (err) {
      console.error("Failed to refresh:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyInvitationLink = (token: string) => {
    const link = `${window.location.origin}/invitations/${token}`;
    navigator.clipboard.writeText(link);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="space-y-4">
          <div className="text-muted-foreground">Ładowanie...</div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !project) {
    return (
      <ProtectedRoute>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Błąd</CardTitle>
              <CardDescription>
                {error || "Projekt nie został znaleziony"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/dashboard")}>
                Wróć do dashboardu
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  if (!fullUser?.isAdmin) {
    return (
      <ProtectedRoute>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Brak uprawnień</CardTitle>
              <CardDescription>
                Tylko administratorzy mogą zarządzać użytkownikami projektu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/dashboard")}>
                Wróć do dashboardu
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-4 max-w-screen-sm">
        <div className="flex flex-col items-start gap-8">
          <div>
            <h1 className="text-3xl font-bold">Zarządzanie użytkownikami</h1>
            <p className="text-muted-foreground mt-1">
              Projekt: {project.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Odśwież
            </Button>
            <Sheet open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
              <SheetTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Zaproś użytkownika
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Utwórz zaproszenie</SheetTitle>
                  <SheetDescription>
                    Wygeneruj link zaproszenia, który możesz wysłać użytkownikom
                  </SheetDescription>
                </SheetHeader>
                <form
                  onSubmit={handleCreateInvitation}
                  className="space-y-4 mt-4 p-4"
                >
                  {inviteError && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                      {inviteError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="role" className="text-sm font-medium">
                      Rola *
                    </label>
                    <Select
                      value={inviteRole}
                      onValueChange={(value) =>
                        setInviteRole(value as "Guest" | "Maintainer")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Guest">
                          Gość (tylko przeglądanie)
                        </SelectItem>
                        <SelectItem value="Maintainer">
                          Maintainer (może edytować)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="expiresInHours"
                      className="text-sm font-medium"
                    >
                      Ważność (w godzinach)
                    </label>
                    <Input
                      id="expiresInHours"
                      type="number"
                      min="1"
                      max="168"
                      value={inviteExpiresInHours}
                      onChange={(e) =>
                        setInviteExpiresInHours(Number(e.target.value))
                      }
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Maksymalnie 168 godzin (7 dni)
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={creatingInvitation}
                      className="flex-1"
                    >
                      {creatingInvitation
                        ? "Tworzenie..."
                        : "Utwórz zaproszenie"}
                    </Button>
                  </div>
                </form>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Członkowie projektu</CardTitle>
            <CardDescription>
              Lista wszystkich użytkowników mających dostęp do tego projektu
            </CardDescription>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Brak członków w tym projekcie. Zaproś użytkowników, aby
                rozpocząć.
              </p>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border rounded-lg gap-12"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {member.user.name || member.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Dołączył:{" "}
                        {new Date(member.createdAt).toLocaleDateString("pl-PL")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleRoleChange(
                            member.id,
                            value as "Guest" | "Maintainer"
                          )
                        }
                        disabled={updatingRole === member.id}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Guest">Gość</SelectItem>
                          <SelectItem value="Maintainer">Maintainer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={removingMember === member.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Zaproszenia</CardTitle>
            <CardDescription>
              Lista wszystkich zaproszeń do tego projektu
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invitations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Brak zaproszeń. Utwórz nowe zaproszenie, aby zaprosić
                użytkowników.
              </p>
            ) : (
              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className={`flex items-center justify-between p-3 border rounded-lg ${
                      !invitation.isValid ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm font-medium ${
                            invitation.isValid
                              ? "text-green-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          {invitation.isValid
                            ? "Aktywne"
                            : invitation.used
                              ? "Użyte"
                              : "Wygasło"}
                        </p>
                        {invitation.used && (
                          <span className="text-xs text-muted-foreground">
                            (użyte)
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          ({invitation.role === "Guest" ? "Gość" : "Maintainer"}
                          )
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Wygasa:{" "}
                        {new Date(invitation.expiresAt).toLocaleString("pl-PL")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Utworzone:{" "}
                        {new Date(invitation.createdAt).toLocaleString("pl-PL")}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyInvitationLink(invitation.token)}
                      disabled={!invitation.isValid}
                    >
                      <Copy className="h-4 w-4 mr-2" />
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
