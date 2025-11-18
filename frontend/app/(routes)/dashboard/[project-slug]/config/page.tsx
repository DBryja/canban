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
import {
  Trash2,
  RefreshCw,
  Plus,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useAppSidebar } from "@/app/components/AppSidebar/context";
import type { Project } from "@/app/components/AppSidebar/utils";

interface TaskTag {
  id: string;
  name: string;
  color: string | null;
}

interface ProjectColumn {
  id: string;
  projectId: string;
  tagId: string;
  order: number;
  tag: TaskTag;
}

export default function ProjectConfigPage() {
  const params = useParams();
  const router = useRouter();
  const { user, fullUser } = useAuth();
  const { findProjectBySlug } = useAppSidebar();
  const projectSlug = params["project-slug"] as string;

  const [project, setProject] = useState<Project | null>(null);
  const [columns, setColumns] = useState<ProjectColumn[]>([]);
  const [tags, setTags] = useState<TaskTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string>("");
  const [addingColumn, setAddingColumn] = useState(false);
  const [columnError, setColumnError] = useState<string | null>(null);
  const [deletingColumn, setDeletingColumn] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!projectSlug || !user || !fullUser?.isAdmin) {
      if (user && fullUser && !fullUser.isAdmin) {
        setError("Tylko administratorzy mogą zarządzać konfiguracją projektu");
        setLoading(false);
      }
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const foundProject = findProjectBySlug(projectSlug);

        if (!foundProject) {
          setError("Projekt nie został znaleziony");
          setLoading(false);
          return;
        }

        setProject(foundProject);

        const columnsResponse = await api.get<{ columns: ProjectColumn[] }>(
          `/projects/${foundProject.id}/columns`
        );
        const sortedColumns = columnsResponse.data.columns.sort(
          (a, b) => a.order - b.order
        );
        setColumns(sortedColumns);

        const tagsResponse = await api.get<{ tags: TaskTag[] }>("/tags");
        setTags(tagsResponse.data.tags);
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

  const handleRefresh = async () => {
    if (!project) return;

    try {
      setLoading(true);
      const columnsResponse = await api.get<{ columns: ProjectColumn[] }>(
        `/projects/${project.id}/columns`
      );
      const sortedColumns = columnsResponse.data.columns.sort(
        (a, b) => a.order - b.order
      );
      setColumns(sortedColumns);
    } catch (err) {
      console.error("Failed to refresh:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !selectedTagId) return;

    try {
      setAddingColumn(true);
      setColumnError(null);

      await api.post<{ column: ProjectColumn }>(
        `/projects/${project.id}/columns`,
        {
          tagId: selectedTagId,
        }
      );

      const columnsResponse = await api.get<{ columns: ProjectColumn[] }>(
        `/projects/${project.id}/columns`
      );
      const sortedColumns = columnsResponse.data.columns.sort(
        (a, b) => a.order - b.order
      );
      setColumns(sortedColumns);

      setSelectedTagId("");
      setIsAddColumnModalOpen(false);
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Nie udało się dodać kolumny";
      setColumnError(errorMessage);
    } finally {
      setAddingColumn(false);
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!project) return;

    if (!confirm("Czy na pewno chcesz usunąć tę kolumnę?")) {
      return;
    }

    try {
      setDeletingColumn(columnId);
      await api.delete(`/projects/${project.id}/columns/${columnId}`);

      const columnsResponse = await api.get<{ columns: ProjectColumn[] }>(
        `/projects/${project.id}/columns`
      );
      const sortedColumns = columnsResponse.data.columns.sort(
        (a, b) => a.order - b.order
      );
      setColumns(sortedColumns);
    } catch (err) {
      console.error("Failed to delete column:", err);
    } finally {
      setDeletingColumn(null);
    }
  };

  const handleMoveColumn = async (
    columnId: string,
    direction: "up" | "down"
  ) => {
    if (!project) return;

    const columnIndex = columns.findIndex((col) => col.id === columnId);
    if (columnIndex === -1) return;

    const newIndex = direction === "up" ? columnIndex - 1 : columnIndex + 1;
    if (newIndex < 0 || newIndex >= columns.length) return;

    const column = columns[columnIndex];
    const targetColumn = columns[newIndex];

    try {
      setUpdatingOrder(columnId);

      await api.patch(`/projects/${project.id}/columns/${column.id}`, {
        order: targetColumn.order,
      });

      await api.patch(`/projects/${project.id}/columns/${targetColumn.id}`, {
        order: column.order,
      });

      const columnsResponse = await api.get<{ columns: ProjectColumn[] }>(
        `/projects/${project.id}/columns`
      );
      const sortedColumns = columnsResponse.data.columns.sort(
        (a, b) => a.order - b.order
      );
      setColumns(sortedColumns);
    } catch (err) {
      console.error("Failed to move column:", err);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const availableTags = tags.filter(
    (tag) => !columns.some((col) => col.tagId === tag.id)
  );

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
                Tylko administratorzy mogą zarządzać konfiguracją projektu
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
            <h1 className="text-3xl font-bold">Konfiguracja projektu</h1>
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
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <CardTitle>Kolumny kanban</CardTitle>
                <CardDescription className="w-3/4">
                  Zarządzaj kolumnami wyświetlanymi na tablicy kanban projektu.
                  Użyj przycisków strzałek, aby zmienić kolejność kolumn.
                </CardDescription>
              </div>
              <Sheet
                open={isAddColumnModalOpen}
                onOpenChange={setIsAddColumnModalOpen}
              >
                <SheetTrigger asChild>
                  <Button
                    disabled={availableTags.length === 0}
                    className="w-fit"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Dodaj kolumnę
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Dodaj kolumnę</SheetTitle>
                    <SheetDescription>
                      Wybierz tag, który będzie reprezentował tę kolumnę
                    </SheetDescription>
                  </SheetHeader>
                  <form onSubmit={handleAddColumn} className="space-y-4 mt-4">
                    {columnError && (
                      <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                        {columnError}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label htmlFor="tag" className="text-sm font-medium">
                        Tag *
                      </label>
                      <Select
                        value={selectedTagId}
                        onValueChange={setSelectedTagId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz tag" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTags.map((tag) => (
                            <SelectItem key={tag.id} value={tag.id}>
                              <div className="flex items-center gap-2">
                                {tag.color && (
                                  <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: tag.color }}
                                  />
                                )}
                                {tag.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={addingColumn || !selectedTagId}
                        className="flex-1"
                      >
                        {addingColumn ? "Dodawanie..." : "Dodaj kolumnę"}
                      </Button>
                    </div>
                  </form>
                </SheetContent>
              </Sheet>
            </div>
          </CardHeader>
          <CardContent>
            {columns.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Brak kolumn. Dodaj kolumny, aby wyświetlić zadania w formie
                kanban.
              </p>
            ) : (
              <div className="space-y-3">
                {columns.map((column, index) => (
                  <div
                    key={column.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <div className="flex items-center gap-2">
                        {column.tag.color && (
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: column.tag.color }}
                          />
                        )}
                        <span className="text-sm font-medium">
                          {column.tag.name}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        (Kolejność: {column.order})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveColumn(column.id, "up")}
                        disabled={updatingOrder === column.id || index === 0}
                        title="Przenieś w górę"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveColumn(column.id, "down")}
                        disabled={
                          updatingOrder === column.id ||
                          index === columns.length - 1
                        }
                        title="Przenieś w dół"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteColumn(column.id)}
                        disabled={deletingColumn === column.id}
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
      </div>
    </ProtectedRoute>
  );
}
