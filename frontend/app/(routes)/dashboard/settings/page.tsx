"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth";

interface UserWithProjects {
  id: string;
  email: string;
  name: string | null;
  isAdmin?: boolean;
  createdAt: string;
  projectMembers?: Array<{
    id: string;
    role: string;
    project: {
      id: string;
      name: string;
      description: string | null;
    };
  }>;
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [userData, setUserData] = useState<UserWithProjects | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { user: fullUserData } = await getCurrentUser();
        setUserData(fullUserData);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);

  if (!user || loading) {
    return (
      <ProtectedRoute>
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold">Ustawienia</h1>
            <p className="text-muted-foreground">Ładowanie...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const userInitials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase();

  return (
    <ProtectedRoute>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Ustawienia użytkownika</h1>
          <p className="text-muted-foreground">
            Zarządzaj swoim kontem i preferencjami
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informacje o koncie</CardTitle>
            <CardDescription>Twoje podstawowe dane użytkownika</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{user.name || "Brak imienia"}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">ID:</p>
                <p className="text-sm text-muted-foreground">{user.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Email:</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Imię:</p>
                <p className="text-sm text-muted-foreground">{user.name || "Brak"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Data rejestracji:</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString("pl-PL")}
                </p>
              </div>
              {userData?.isAdmin && (
                <div>
                  <p className="text-sm font-medium">Rola:</p>
                  <p className="text-sm text-muted-foreground">Administrator</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {userData?.projectMembers && userData.projectMembers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Twoje projekty</CardTitle>
              <CardDescription>Projekty, w których jesteś członkiem</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {userData.projectMembers.map((member) => (
                  <div key={member.id} className="border rounded-lg p-3">
                    <p className="text-sm font-medium">{member.project.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Rola: {member.role === "Guest" ? "Gość" : "Maintainer"}
                    </p>
                    {member.project.description && (
                      <p className="text-xs text-muted-foreground mt-1">{member.project.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}

