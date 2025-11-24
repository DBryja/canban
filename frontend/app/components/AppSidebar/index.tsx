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
import { useRouter } from "next/navigation";
import {
  Settings,
  LogOut,
  Plus,
  UserCog,
  Home,
  Info,
  LayoutDashboard,
  Cog,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { useAppSidebar } from "./context";

// Root component - wraps the entire sidebar
function AppSidebarRoot({
  children,
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="none" className="md:flex w-full" {...props}>
      {children}
    </Sidebar>
  );
}

// Content wrapper
function AppSidebarContent({ children }: { children: React.ReactNode }) {
  return <SidebarContent>{children}</SidebarContent>;
}

// Footer wrapper
function AppSidebarFooter({ children }: { children: React.ReactNode }) {
  return <SidebarFooter>{children}</SidebarFooter>;
}

// Home button component
function AppSidebarHomeButton({
  ...props
}: React.ComponentProps<typeof SidebarMenuButton>) {
  const { selectedProject, getProjectUrl } = useAppSidebar();
  const router = useRouter();

  const handleClick = () => {
    if (selectedProject) {
      router.push(getProjectUrl(selectedProject));
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <SidebarGroup>
      <SidebarMenuButton
        onClick={handleClick}
        className="w-full justify-start"
        {...props}
      >
        <Home className="mr-2 h-4 w-4" />
        Home
      </SidebarMenuButton>
    </SidebarGroup>
  );
}

// Project select component (content only, no group wrapper)
function AppSidebarProjectSelect() {
  const {
    projects,
    selectedProjectId,
    loading,
    selectProject,
    getProjectUrlById,
  } = useAppSidebar();
  const router = useRouter();

  const handleProjectChange = (projectId: string) => {
    selectProject(projectId);
    const url = getProjectUrlById(projectId);
    if (url) {
      router.push(url);
    }
  };

  return (
    <SidebarMenuItem>
      {loading ? (
        <div className="px-2 py-1.5 text-sm">Ładowanie...</div>
      ) : projects.length > 0 ? (
        <Select
          value={selectedProjectId || undefined}
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
  );
}

// Create project button component (content only, no group wrapper)
function AppSidebarCreateProjectButton({
  ...props
}: React.ComponentProps<typeof SidebarMenuButton>) {
  const { fullUser } = useAuth();
  const router = useRouter();

  if (!fullUser?.isAdmin) return null;

  const handleClick = () => {
    router.push("/dashboard/projects/new");
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={handleClick}
        className="w-full justify-start"
        {...props}
      >
        <Plus className="mr-2 h-4 w-4" />
        Dodaj projekt
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// Project group wrapper - contains both select and create button
function AppSidebarProjectGroup() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Projekt</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <AppSidebarProjectSelect />
          <AppSidebarCreateProjectButton />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function AppSidebarProjectBoardButton({
  ...props
}: React.ComponentProps<typeof SidebarMenuButton>) {
  const { selectedProject, getProjectUrl } = useAppSidebar();
  const router = useRouter();

  if (!selectedProject) return null;

  const handleClick = () => {
    const url = getProjectUrl(selectedProject);
    router.push(`${url}`);
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={handleClick}
        className="w-full justify-start"
        {...props}
      >
        <LayoutDashboard className="mr-2 h-4 w-4" />
        Tablica
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
// Project details button component
function AppSidebarProjectDetailsButton({
  ...props
}: React.ComponentProps<typeof SidebarMenuButton>) {
  const { selectedProject, getProjectUrl } = useAppSidebar();
  const router = useRouter();

  if (!selectedProject) return null;

  const handleClick = () => {
    const url = getProjectUrl(selectedProject);
    router.push(`${url}/details`);
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={handleClick}
        className="w-full justify-start"
        {...props}
      >
        <Info className="mr-2 h-4 w-4" />
        Szczegóły
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function AppSidebarProjectOptions() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Opcje</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <AppSidebarProjectBoardButton />
          <AppSidebarProjectDetailsButton />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

// Config button component
function AppSidebarConfigButton({
  ...props
}: React.ComponentProps<typeof SidebarMenuButton>) {
  const { fullUser } = useAuth();
  const { selectedProject, getProjectUrl } = useAppSidebar();
  const router = useRouter();

  if (!fullUser?.isAdmin || !selectedProject) return null;

  const handleClick = () => {
    const url = getProjectUrl(selectedProject);
    router.push(`${url}/config`);
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={handleClick}
        className="w-full justify-start"
        {...props}
      >
        <Cog className="mr-2 h-4 w-4" />
        Konfiguracja
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// Manage users button component
function AppSidebarManageUsersButton({
  ...props
}: React.ComponentProps<typeof SidebarMenuButton>) {
  const { fullUser } = useAuth();
  const { selectedProject, getProjectUrl } = useAppSidebar();
  const router = useRouter();

  if (!fullUser?.isAdmin || !selectedProject) return null;

  const handleClick = () => {
    const url = getProjectUrl(selectedProject);
    router.push(`${url}/manage`);
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={handleClick}
        className="w-full justify-start"
        {...props}
      >
        <UserCog className="mr-2 h-4 w-4" />
        Zarządzaj użytkownikami
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// Management group wrapper
function AppSidebarManagementGroup() {
  const { fullUser } = useAuth();
  const { selectedProject } = useAppSidebar();

  if (!fullUser?.isAdmin || !selectedProject) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Zarządzanie</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <AppSidebarConfigButton />
          <AppSidebarManageUsersButton />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

// Settings button component
function AppSidebarSettingsButton({
  ...props
}: React.ComponentProps<typeof SidebarMenuButton>) {
  const router = useRouter();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => router.push("/dashboard/settings")}
        className="w-full justify-start"
        {...props}
      >
        <Settings className="mr-2 h-4 w-4" />
        Ustawienia
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// Logout button component
function AppSidebarLogoutButton({
  ...props
}: React.ComponentProps<typeof SidebarMenuButton>) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={handleLogout}
        className="w-full justify-start text-destructive"
        {...props}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Wyloguj się
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// Account section wrapper
function AppSidebarAccountSection({ children }: { children: React.ReactNode }) {
  return (
    <SidebarGroup className="mt-auto">
      <SidebarGroupLabel>Konto</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>{children}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

// User profile component
function AppSidebarUserProfile() {
  const { user } = useAuth();

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
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

// Default composed sidebar - ready to use
function AppSidebarDefault({ className }: { className?: string }) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <AppSidebarRoot className={className}>
      <AppSidebarContent>
        <AppSidebarHomeButton />
        <AppSidebarProjectGroup />
        <AppSidebarProjectOptions />
        <AppSidebarManagementGroup />
        <AppSidebarAccountSection>
          <AppSidebarSettingsButton />
          <AppSidebarLogoutButton />
        </AppSidebarAccountSection>
      </AppSidebarContent>
      <AppSidebarFooter>
        <AppSidebarUserProfile />
      </AppSidebarFooter>
    </AppSidebarRoot>
  );
}

// Export compound components
export const AppSidebar = Object.assign(AppSidebarDefault, {
  Root: AppSidebarRoot,
  Content: AppSidebarContent,
  Footer: AppSidebarFooter,
  HomeButton: AppSidebarHomeButton,
  ProjectGroup: AppSidebarProjectGroup,
  ProjectSelect: AppSidebarProjectSelect,
  CreateProjectButton: AppSidebarCreateProjectButton,
  ProjectDetailsButton: AppSidebarProjectDetailsButton,
  ConfigButton: AppSidebarConfigButton,
  ManageUsersButton: AppSidebarManageUsersButton,
  ManagementGroup: AppSidebarManagementGroup,
  AccountSection: AppSidebarAccountSection,
  SettingsButton: AppSidebarSettingsButton,
  LogoutButton: AppSidebarLogoutButton,
  UserProfile: AppSidebarUserProfile,
});
