"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Witaj w panelu zarządzania projektami
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Witaj!</CardTitle>
          <CardDescription>
            Wybierz projekt z sidebaru lub utwórz nowy projekt, jeśli jesteś
            administratorem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Użyj menu po lewej stronie, aby nawigować po aplikacji.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
