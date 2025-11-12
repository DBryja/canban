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
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { useAppSidebar } from "@/app/components/AppSidebar/context";
import type { Project } from "@/app/components/AppSidebar/utils";

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { findProjectBySlug } = useAppSidebar();
  const projectSlug = params["project-slug"] as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectSlug || !user) return;

    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);

        // Find project by slug using utility from AppSidebar
        const foundProject = findProjectBySlug(projectSlug);

        if (!foundProject) {
          setError("Projekt nie został znaleziony");
          return;
        }

        // Fetch full project details
        const projectResponse = await api.get<Project>(
          `/projects/${foundProject.id}`
        );
        setProject(projectResponse.data);
      } catch (err: unknown) {
        const errorData = (
          err as { response?: { data?: { message?: string }; status?: number } }
        )?.response;
        if (errorData?.status === 404) {
          setError("Projekt nie został znaleziony");
        } else {
          setError("Nie udało się pobrać szczegółów projektu");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectSlug, user, findProjectBySlug]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="space-y-4">
          <div className="text-muted-foreground">Ładowanie projektu...</div>
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
              <button
                onClick={() => router.push("/dashboard")}
                className="text-primary hover:underline"
              >
                Wróć do dashboardu
              </button>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground mt-2">{project.description}</p>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Szczegóły projektu</CardTitle>
            <CardDescription>Informacje o projekcie</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                ID projektu
              </label>
              <p className="text-sm">{project.id}</p>
            </div>
            {project.createdAt && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Utworzony
                </label>
                <p className="text-sm">
                  {new Date(project.createdAt).toLocaleDateString("pl-PL", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
            {project.updatedAt && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Ostatnia aktualizacja
                </label>
                <p className="text-sm">
                  {new Date(project.updatedAt).toLocaleDateString("pl-PL", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
            {project.creator && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Twórca
                </label>
                <p className="text-sm">
                  {project.creator.name || project.creator.email}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

