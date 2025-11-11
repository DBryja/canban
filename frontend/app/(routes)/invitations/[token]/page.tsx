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

interface Invitation {
  id: string;
  token: string;
  project: {
    id: string;
    name: string;
    description: string | null;
    creator: {
      id: string;
      email: string;
      name: string | null;
    };
  };
  role: string;
  expiresAt: string;
  createdAt: string;
}

export default function InvitationPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchInvitation = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get<{ invitation: Invitation }>(
          `/invitations/${token}`
        );
        setInvitation(response.data.invitation);
      } catch (err: unknown) {
        const errorData = (
          err as { response?: { data?: { message?: string }; status?: number } }
        )?.response;
        if (errorData?.status === 404) {
          setError("Zaproszenie nie zostało znalezione");
        } else if (errorData?.status === 410) {
          setError(
            errorData.data?.message ||
              "Zaproszenie wygasło lub zostało już użyte"
          );
        } else {
          setError("Nie udało się pobrać szczegółów zaproszenia");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!user || !token) return;

    try {
      setAccepting(true);
      setError(null);
      await api.post(`/invitations/${token}/accept`);

      // Refresh user data to get updated project info
      await refreshUser();

      setSuccess(true);

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: unknown) {
      const errorData = (
        err as { response?: { data?: { message?: string }; status?: number } }
      )?.response;
      if (errorData?.status === 404) {
        setError("Zaproszenie nie zostało znalezione");
      } else if (errorData?.status === 410) {
        setError("Zaproszenie wygasło");
      } else if (errorData?.status === 409) {
        setError(
          errorData.data?.message || "Już jesteś członkiem tego projektu"
        );
      } else if (errorData?.status === 400) {
        setError(
          errorData.data?.message || "Nie możesz dołączyć do własnego projektu"
        );
      } else {
        setError("Nie udało się zaakceptować zaproszenia");
      }
    } finally {
      setAccepting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Ładowanie...</div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Błąd</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full"
            >
              Przejdź do dashboardu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Wymagane logowanie</CardTitle>
            <CardDescription>
              Musisz być zalogowany, aby zaakceptować zaproszenie
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() =>
                router.push(
                  `/login?redirect=${encodeURIComponent(`/invitations/${token}`)}`
                )
              }
              className="w-full"
            >
              Zaloguj się
            </Button>
            <Button
              onClick={() =>
                router.push(
                  `/register?redirect=${encodeURIComponent(`/invitations/${token}`)}`
                )
              }
              variant="outline"
              className="w-full"
            >
              Zarejestruj się
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-green-600">Sukces!</CardTitle>
            <CardDescription>
              Dołączyłeś do projektu {invitation?.project.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Przekierowywanie do dashboardu...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">
          Ładowanie szczegółów zaproszenia...
        </div>
      </div>
    );
  }

  const isExpired = new Date(invitation.expiresAt) < new Date();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Zaproszenie do projektu</CardTitle>
          <CardDescription>
            Zostałeś zaproszony do dołączenia do projektu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Nazwa projektu
              </label>
              <p className="text-lg font-semibold">{invitation.project.name}</p>
            </div>

            {invitation.project.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Opis
                </label>
                <p className="text-sm">{invitation.project.description}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Twórca
              </label>
              <p className="text-sm">
                {invitation.project.creator.name ||
                  invitation.project.creator.email}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Rola
              </label>
              <p className="text-sm">
                {invitation.role === "Guest"
                  ? "Gość (tylko przeglądanie)"
                  : "Maintainer (może edytować)"}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Wygasa
              </label>
              <p className="text-sm">
                {new Date(invitation.expiresAt).toLocaleDateString("pl-PL", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {isExpired ? (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              To zaproszenie wygasło
            </div>
          ) : !user ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Musisz być zalogowany, aby zaakceptować zaproszenie
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    router.push(
                      `/login?redirect=${encodeURIComponent(`/invitations/${token}`)}`
                    )
                  }
                  className="flex-1"
                >
                  Zaloguj się
                </Button>
                <Button
                  onClick={() =>
                    router.push(
                      `/register?redirect=${encodeURIComponent(`/invitations/${token}`)}`
                    )
                  }
                  variant="outline"
                  className="flex-1"
                >
                  Zarejestruj się
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleAccept}
                disabled={accepting}
                className="flex-1"
              >
                {accepting ? "Akceptowanie..." : "Zaakceptuj zaproszenie"}
              </Button>
              <Button
                onClick={() => router.push("/dashboard")}
                variant="outline"
                disabled={accepting}
              >
                Anuluj
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
