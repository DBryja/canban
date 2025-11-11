import LoginForm from "@/components/LoginForm";
import Link from "next/link";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg border p-8 shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Zaloguj się</h1>
          <p className="text-muted-foreground mb-6">
            Wprowadź swoje dane, aby się zalogować
          </p>

          <Suspense fallback={<div>Ładowanie...</div>}>
            <LoginForm />
          </Suspense>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Nie masz konta? </span>
            <Link href="/register" className="text-primary hover:underline">
              Zarejestruj się
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
