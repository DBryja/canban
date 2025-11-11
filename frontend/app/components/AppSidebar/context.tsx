"use client";

import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { Project, createSlug, findProjectBySlug, getProjectUrl } from "./utils";
import { SidebarProvider } from "../ui/sidebar";

interface AppSidebarContextValue {
  projects: Project[];
  selectedProject: Project | null;
  selectedProjectId: string | null;
  loading: boolean;
  error: string | null;
  refreshProjects: () => Promise<void>;
  selectProject: (projectId: string) => void;
  selectProjectBySlug: (slug: string) => void;
  getProjectUrl: (project: Project) => string;
  getProjectUrlById: (projectId: string) => string | null;
  createSlug: (name: string) => string;
  findProjectBySlug: (slug: string) => Project | undefined;
}

const AppSidebarContext = React.createContext<
  AppSidebarContextValue | undefined
>(undefined);

export function useAppSidebar() {
  const context = React.useContext(AppSidebarContext);
  if (!context) {
    throw new Error("useAppSidebar must be used within AppSidebarProvider");
  }
  return context;
}

interface AppSidebarProviderProps {
  children: React.ReactNode;
}

export function AppSidebarProvider({ children }: AppSidebarProviderProps) {
  const { user, fullUser, refreshUser } = useAuth();
  const pathname = usePathname();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<
    string | null
  >(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refreshProjects = React.useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Only refresh if we don't have full user data yet
      if (!fullUser) {
        await refreshUser();
        return;
      }

      const response = await api.get<{ projects: Project[] }>("/projects");
      setProjects(response.data.projects);

      // Sync selected project with URL if on project page
      const pathParts = pathname.split("/").filter(Boolean);
      if (pathParts.length >= 2 && pathParts[0] === "dashboard") {
        const secondPart = pathParts[1];
        // Check if second part is a project slug (not reserved routes)
        if (
          secondPart !== "projects" &&
          secondPart !== "settings" &&
          secondPart !== "team"
        ) {
          const projectSlug = secondPart;
          const project = findProjectBySlug(
            response.data.projects,
            projectSlug
          );
          if (project) {
            setSelectedProjectId(project.id);
          } else {
            setSelectedProjectId(null);
          }
        } else {
          // On reserved routes, clear selection
          setSelectedProjectId(null);
        }
      } else {
        // If not on dashboard, clear selection
        setSelectedProjectId(null);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setError("Nie udało się pobrać projektów");
    } finally {
      setLoading(false);
    }
  }, [user, fullUser, pathname, refreshUser]);

  React.useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const selectProject = React.useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
  }, []);

  const selectProjectBySlug = React.useCallback(
    (slug: string) => {
      const project = findProjectBySlug(projects, slug);
      if (project) {
        setSelectedProjectId(project.id);
      }
    },
    [projects]
  );

  const selectedProject =
    selectedProjectId !== null
      ? projects.find((p) => p.id === selectedProjectId) || null
      : null;

  const getProjectUrlById = React.useCallback(
    (projectId: string): string | null => {
      const project = projects.find((p) => p.id === projectId);
      return project ? getProjectUrl(project) : null;
    },
    [projects]
  );

  const value: AppSidebarContextValue = React.useMemo(
    () => ({
      projects,
      selectedProject,
      selectedProjectId,
      loading,
      error,
      refreshProjects,
      selectProject,
      selectProjectBySlug,
      getProjectUrl,
      getProjectUrlById,
      createSlug,
      findProjectBySlug: (slug: string) => findProjectBySlug(projects, slug),
    }),
    [
      projects,
      selectedProject,
      selectedProjectId,
      loading,
      error,
      refreshProjects,
      selectProject,
      selectProjectBySlug,
      getProjectUrlById,
    ]
  );

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebarContext.Provider value={value}>
        {children}
      </AppSidebarContext.Provider>
    </SidebarProvider>
  );
}
