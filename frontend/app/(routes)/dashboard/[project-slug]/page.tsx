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

export default function ProjectPage() {
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

  // Get tasks for each column based on tag
  const getTasksForColumn = (columnTagId: string) => {
    if (!project.tasks) return [];
    return project.tasks.filter((task) =>
      task.tags?.some((tag) => tag.id === columnTagId)
    );
  };

  return (
    <ProtectedRoute>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground mt-2">{project.description}</p>
          )}
        </div>

        {project.columns && project.columns.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {project.columns.map((column) => {
              const columnTasks = getTasksForColumn(column.tag.id);
              return (
                <div
                  key={column.id}
                  className="shrink-0 w-80 bg-card border rounded-lg p-4"
                >
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {column.tag.color && (
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: column.tag.color }}
                        />
                      )}
                      {column.tag.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {columnTasks.length} zadanie(ń)
                    </p>
                  </div>
                  <div className="space-y-2">
                    {columnTasks.length > 0 ? (
                      columnTasks.map((task) => (
                        <Card key={task.id} className="p-3">
                          <CardHeader className="p-0 pb-2">
                            <CardTitle className="text-base">
                              {task.title}
                            </CardTitle>
                            {task.description && (
                              <CardDescription className="text-sm">
                                {task.description}
                              </CardDescription>
                            )}
                          </CardHeader>
                          {task.tags && task.tags.length > 0 && (
                            <CardContent className="p-0 pt-2">
                              <div className="flex flex-wrap gap-1">
                                {task.tags.map((tag) => (
                                  <span
                                    key={tag.id}
                                    className="text-xs px-2 py-1 rounded bg-muted"
                                    style={
                                      tag.color
                                        ? {
                                            backgroundColor: `${tag.color}20`,
                                            color: tag.color,
                                          }
                                        : undefined
                                    }
                                  >
                                    {tag.name}
                                  </span>
                                ))}
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Brak zadań
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Brak kolumn</CardTitle>
              <CardDescription>
                Dodaj kolumny do projektu, aby wyświetlić zadania w formie
                kanban
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}
