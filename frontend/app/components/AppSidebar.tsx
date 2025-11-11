"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/app/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import {
  Settings,
  LogOut,
  Plus,
  UserPlus,
  UserCog,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  creatorId: string;
}

// Helper function to create slug from project name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Helper function to find project by slug
function findProjectBySlug(projects: Project[], slug: string): Project | undefined {
  return projects.find((p) => createSlug(p.name) === slug || p.id === slug);
}

export function AppSidebar() {
  const { user, fullUser, logout, refreshUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Only refresh if we don't have full user data yet
    if (!fullUser) {
      refreshUser().catch(() => {
        // Error handled in refreshUser - don't log here to avoid spam
      });
      return;
    }

    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await api.get<{ projects: Project[] }>("/projects");
        setProjects(response.data.projects);
        
        // Sync selected project with URL if on project page
        const pathParts = pathname.split("/").filter(Boolean);
        if (pathParts.length >= 2 && pathParts[0] === "dashboard") {
          const secondPart = pathParts[1];
          // Check if second part is a project slug (not reserved routes)
          if (secondPart !== "projects" && secondPart !== "settings" && secondPart !== "team") {
            const projectSlug = secondPart;
            const project = findProjectBySlug(response.data.projects, projectSlug);
            if (project) {
              setSelectedProject(project.id);
            } else {
              setSelectedProject("");
            }
          } else {
            // On reserved routes, clear selection
            setSelectedProject("");
          }
        } else {
          // If not on dashboard, clear selection
          setSelectedProject("");
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, fullUser?.isAdmin, pathname]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleProjectChange = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setSelectedProject(projectId);
      const slug = createSlug(project.name);
      router.push(`/dashboard/${slug}`);
    }
  };

  const handleCreateProject = () => {
    router.push("/dashboard/projects/new");
  };

  const handleInviteUser = () => {
    if (selectedProject) {
      router.push(`/dashboard/projects/${selectedProject}/invite`);
    } else {
      router.push("/dashboard/projects/invite");
    }
  };

  const handleManageProjectUsers = () => {
    if (selectedProject) {
      const project = projects.find((p) => p.id === selectedProject);
      if (project) {
        const slug = createSlug(project.name);
        router.push(`/dashboard/${slug}/manage`);
      }
    }
  };

  if (!user) return null;

  const userInitials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase();

  return (
    <Sidebar collapsible="none" className="md:flex">
      <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Projekt</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  {loading ? (
                    <div className="px-2 py-1.5 text-sm">Ładowanie...</div>
                  ) : projects.length > 0 ? (
                    <Select
                      value={selectedProject || undefined}
                      onValueChange={handleProjectChange}
                    >
                      <SelectTrigger className="w-full">
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
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Brak projektów
                    </div>
                  )}
                </SidebarMenuItem>
                {fullUser?.isAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={handleCreateProject}
                      className="w-full justify-start"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Dodaj projekt
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {fullUser?.isAdmin && (
            <SidebarGroup>
              <SidebarGroupLabel>Zarządzanie</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {selectedProject && (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={handleManageProjectUsers}
                        className="w-full justify-start"
                      >
                        <UserCog className="mr-2 h-4 w-4" />
                        Zarządzaj użytkownikami
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          <SidebarGroup>
            <SidebarGroupLabel>Konto</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => router.push("/dashboard/settings")}
                    className="w-full justify-start"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Ustawienia
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={handleLogout}
                    className="w-full justify-start text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Wyloguj się
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-2 px-2 py-1.5">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {user.name || user.email}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
  );
}

