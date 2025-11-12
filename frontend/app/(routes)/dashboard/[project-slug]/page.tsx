"use client";

import { useEffect, useState, useRef } from "react";
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
import { Plus } from "lucide-react";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { useAppSidebar } from "@/app/components/AppSidebar/context";
import type { Project } from "@/app/components/AppSidebar/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { user, fullUser } = useAuth();
  const { findProjectBySlug } = useAppSidebar();
  const projectSlug = params["project-slug"] as string;

  const containerRef = useRef<HTMLDivElement>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<TaskTag[]>([]);
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string>("");
  const [addingColumn, setAddingColumn] = useState(false);
  const [columnError, setColumnError] = useState<string | null>(null);
  const [columnHeight, setColumnHeight] = useState<string>("600px");
  const [userRole, setUserRole] = useState<
    "admin" | "maintainer" | "guest" | null
  >(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
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

        // Check user role
        if (fullUser?.isAdmin) {
          setUserRole("admin");
        } else {
          // For non-admins, we'll show the button and let the API return an error
          // if they don't have permissions. This is better UX than trying to check
          // permissions upfront (which would require admin-only endpoints).
          setUserRole("guest");
        }

        // Fetch full project details
        const projectResponse = await api.get<Project>(
          `/projects/${foundProject.id}`
        );
        setProject(projectResponse.data);

        // Fetch all tags
        try {
          const tagsResponse = await api.get<{ tags: TaskTag[] }>("/tags");
          setTags(tagsResponse.data.tags);
        } catch (err) {
          console.error("Failed to fetch tags:", err);
        }
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
  }, [projectSlug, user, fullUser, findProjectBySlug]);

  useEffect(() => {
    if (!project) return;
    const wrapperEl = scrollAreaRef.current;
    if (!wrapperEl) return;
    setColumnHeight(wrapperEl.clientHeight + "px" ?? "800px");
  }, [project]);

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

      // Refresh project to get updated columns
      const projectResponse = await api.get<Project>(`/projects/${project.id}`);
      setProject(projectResponse.data);

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

  const availableTags = tags.filter(
    (tag) => !project.columns?.some((col) => col.tagId === tag.id)
  );

  // Show button for admins, and for others we'll let the API handle permission checks
  // This allows maintainers to add columns even though we can't check their role upfront
  const canManageColumns = userRole === "admin" || userRole === "guest";

  return (
    <ProtectedRoute>
      <div
        className="space-y-4 grid grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden"
        style={{ height: "calc(100vh - 32px)" }}
        ref={containerRef}
      >
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground mt-2">{project.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          {canManageColumns && (
            <Sheet
              open={isAddColumnModalOpen}
              onOpenChange={setIsAddColumnModalOpen}
            >
              <SheetTrigger asChild>
                <Button disabled={availableTags.length === 0}>
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
                <form
                  onSubmit={handleAddColumn}
                  className="space-y-4 mt-4 px-4"
                >
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
          )}
        </div>

        {project.columns && project.columns.length > 0 ? (
          <ScrollArea
            className="h-full overflow-y-hidden overflow-x-auto"
            ref={scrollAreaRef}
          >
            <div
              className="grid gap-4 h-full max-h-full overflow-visible whitespace-nowrap"
              style={{
                gridTemplateRows: `100%`,
                gridTemplateColumns: `repeat(${project.columns.length}, 320px)`,
              }}
            >
              {project.columns.map((column) => {
                const columnTasks = getTasksForColumn(column.tag.id);
                return (
                  <div
                    key={column.id}
                    className="bg-card border rounded-lg py-4 px-1 h-full overflow-y-hidden"
                    style={{ height: columnHeight }}
                  >
                    <div className="flex justify-between items-center px-3 relative z-40">
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
                        {columnTasks.length} zadań
                      </p>
                      <span
                        className="absolute top-[90%] left-0 right-0 h-4 opacity-100"
                        style={{
                          backgroundImage: `linear-gradient(to bottom, rgb(52, 52, 52), transparent)`,
                        }}
                      />
                    </div>
                    <ScrollArea className="space-y-2 h-full pl-1 pr-3">
                      <div className="space-y-2">
                        {columnTasks.length > 0 ? (
                          columnTasks.map((task, i) => (
                            <Card
                              key={task.id}
                              className={`p-3 ${i === columnTasks.length - 1 ? "mb-6" : ""} ${i === 0 ? "mt-4" : ""}`}
                            >
                              <CardHeader className="p-0 pb-2">
                                <CardTitle className="text-base">
                                  {task.title}
                                </CardTitle>
                                {task.description && (
                                  <CardDescription className="text-sm text-wrap">
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
                    </ScrollArea>
                  </div>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
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
