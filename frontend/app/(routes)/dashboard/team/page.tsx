"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

interface TeamMember {
  id: string;
  role: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  createdAt: string;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  owner: {
    id: string;
    email: string;
    name: string | null;
  };
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export default function TeamManagementPage() {
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await api.get<{ team: Team }>("/teams/my/team");
        setTeam(response.data.team);
      } catch (error: any) {
        if (error.response?.status === 404) {
          // User doesn't own a team
          setTeam(null);
        } else {
          console.error("Failed to fetch team:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTeam();
    }
  }, [user]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold">Zarządzanie teamem</h1>
            <p className="text-muted-foreground">Ładowanie...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!team) {
    return (
      <ProtectedRoute>
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold">Zarządzanie teamem</h1>
            <p className="text-muted-foreground">
              Nie jesteś właścicielem żadnego teamu
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Zarządzanie teamem</h1>
          <p className="text-muted-foreground">
            Zarządzaj członkami i ustawieniami swojego teamu
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informacje o teamie</CardTitle>
            <CardDescription>Podstawowe informacje o twoim teamie</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium">Nazwa:</p>
              <p className="text-sm text-muted-foreground">{team.name}</p>
            </div>
            {team.description && (
              <div>
                <p className="text-sm font-medium">Opis:</p>
                <p className="text-sm text-muted-foreground">{team.description}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium">Właściciel:</p>
              <p className="text-sm text-muted-foreground">
                {team.owner.name || team.owner.email}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Utworzony:</p>
              <p className="text-sm text-muted-foreground">
                {new Date(team.createdAt).toLocaleDateString("pl-PL")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Członkowie teamu</CardTitle>
            <CardDescription>
              Lista wszystkich członków twojego teamu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="border rounded-lg p-3 bg-muted/50">
                <p className="text-sm font-medium">
                  {team.owner.name || team.owner.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {team.owner.email} • Właściciel
                </p>
              </div>
              {team.members.map((member) => (
                <div key={member.id} className="border rounded-lg p-3">
                  <p className="text-sm font-medium">
                    {member.user.name || member.user.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {member.user.email} • {member.role}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dołączył: {new Date(member.createdAt).toLocaleDateString("pl-PL")}
                  </p>
                </div>
              ))}
              {team.members.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Brak członków oprócz właściciela
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

