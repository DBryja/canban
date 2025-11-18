"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

interface Task {
  id: string;
  number: number | null;
  title: string;
  description: string | null;
  tags?: Array<{
    id: string;
    name: string;
    color: string | null;
  }>;
  columnOrders?: Array<{
    id: string;
    columnId: string;
    order: number;
  }>;
}

interface SortableTaskProps {
  task: Task;
  columnId: string;
}

function TaskCard({
  task,
  isDragging = false,
}: {
  task: Task;
  isDragging?: boolean;
}) {
  return (
    <Card
      className={`p-3 ${isDragging ? "shadow-2xl rotate-2" : ""}`}
      style={isDragging ? { opacity: 1 } : undefined}
    >
      <CardHeader className="p-0 pb-2">
        <CardTitle className="text-base">
          #{task.number ?? "?"} - {task.title}
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
  );
}

function SortableTask({ task, columnId }: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className="cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <TaskCard task={task} />
      </div>
    </div>
  );
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
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // Get tasks for each column based on tag and sort by order
  const getTasksForColumn = (columnTagId: string, columnId: string) => {
    if (!project.tasks) return [];
    const tasks = project.tasks.filter((task) =>
      task.tags?.some((tag) => tag.id === columnTagId)
    );

    return tasks.sort((a, b) => {
      const aOrder =
        a.columnOrders?.find((co) => co.columnId === columnId)?.order ??
        Infinity;
      const bOrder =
        b.columnOrders?.find((co) => co.columnId === columnId)?.order ??
        Infinity;
      return aOrder - bOrder;
    });
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

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = project?.tasks?.find((t) => t.id === taskId);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!project || !over || active.id === over.id) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const task = project.tasks?.find((t) => t.id === taskId);
    if (!task) return;

    const sourceColumn = project.columns?.find((col) => {
      const columnTasks = getTasksForColumn(col.tag.id, col.id);
      return columnTasks.some((t) => t.id === taskId);
    });

    if (!sourceColumn) return;

    const isOverColumn = project.columns?.some((col) => col.id === overId);
    const isOverTask = project.tasks?.some((t) => t.id === overId);

    if (isOverColumn) {
      const targetColumn = project.columns?.find((col) => col.id === overId);
      if (!targetColumn || sourceColumn.id === targetColumn.id) return;

      try {
        setUpdatingTask(taskId);
        const targetTasks = getTasksForColumn(
          targetColumn.tag.id,
          targetColumn.id
        );
        const newOrder = targetTasks.length;

        await api.patch(`/projects/${project.id}/tasks/${taskId}/move`, {
          fromColumnId: sourceColumn.id,
          toColumnId: targetColumn.id,
          newOrder,
        });

        const projectResponse = await api.get<Project>(
          `/projects/${project.id}`
        );
        setProject(projectResponse.data);
      } catch (err) {
        console.error("Failed to move task:", err);
      } finally {
        setUpdatingTask(null);
      }
    } else if (isOverTask) {
      const targetTask = project.tasks?.find((t) => t.id === overId);
      if (!targetTask) return;

      const targetColumn = project.columns?.find((col) => {
        const columnTasks = getTasksForColumn(col.tag.id, col.id);
        return columnTasks.some((t) => t.id === overId);
      });

      if (!targetColumn) return;

      const isSameColumn = sourceColumn.id === targetColumn.id;
      const columnTasks = getTasksForColumn(
        targetColumn.tag.id,
        targetColumn.id
      );
      const targetIndex = columnTasks.findIndex((t) => t.id === overId);

      if (targetIndex === -1) return;

      try {
        setUpdatingTask(taskId);

        if (isSameColumn) {
          const newTasks = arrayMove(
            columnTasks,
            columnTasks.findIndex((t) => t.id === taskId),
            targetIndex
          );
          const taskOrders = newTasks.map((t, index) => ({
            taskId: t.id,
            order: index,
          }));

          await api.patch(`/projects/${project.id}/tasks/reorder`, {
            columnId: targetColumn.id,
            taskOrders,
          });
        } else {
          await api.patch(`/projects/${project.id}/tasks/${taskId}/move`, {
            fromColumnId: sourceColumn.id,
            toColumnId: targetColumn.id,
            newOrder: targetIndex,
          });
        }

        const projectResponse = await api.get<Project>(
          `/projects/${project.id}`
        );
        setProject(projectResponse.data);
      } catch (err) {
        console.error("Failed to move task:", err);
      } finally {
        setUpdatingTask(null);
      }
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
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
                  const columnTasks = getTasksForColumn(
                    column.tag.id,
                    column.id
                  );
                  const taskIds = columnTasks.map((t) => t.id);
                  return (
                    <div
                      key={column.id}
                      id={column.id}
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
                        <SortableContext
                          items={taskIds}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2">
                            {columnTasks.length > 0 ? (
                              columnTasks.map((task, i) => (
                                <div
                                  key={task.id}
                                  className={
                                    i === columnTasks.length - 1 ? "mb-6" : ""
                                  }
                                  style={
                                    i === 0 ? { marginTop: "1rem" } : undefined
                                  }
                                >
                                  <SortableTask
                                    task={task}
                                    columnId={column.id}
                                  />
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                Brak zadań
                              </p>
                            )}
                          </div>
                        </SortableContext>
                      </ScrollArea>
                    </div>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
            <DragOverlay
              style={{
                zIndex: 9999,
                cursor: "grabbing",
              }}
            >
              {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
            </DragOverlay>
          </DndContext>
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
