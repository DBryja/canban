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

interface Project {
  id: string;
  name: string;
  description: string | null;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string | null;
    email: string;
  };
  tasks?: Array<{
    id: string;
    title: string;
    description: string | null;
  }>;
}

// Helper function to create slug from project name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
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

        // First, get all projects to find the one matching the slug
        const projectsResponse = await api.get<{ projects: Project[] }>(
          "/projects"
        );
        const projects = projectsResponse.data.projects;

        // Find project by slug or ID
        const foundProject = projects.find(
          (p) => createSlug(p.name) === projectSlug || p.id === projectSlug
        );

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
  }, [projectSlug, user]);

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
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
