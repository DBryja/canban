import RegisterForm from "@/components/RegisterForm";
import Link from "next/link";
import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg border p-8 shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Zarejestruj się</h1>
          <p className="text-muted-foreground mb-6">
            Utwórz konto, aby rozpocząć pracę
          </p>

          <Suspense fallback={<div>Ładowanie...</div>}>
            <RegisterForm />
          </Suspense>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Masz już konto? </span>
            <Link href="/login" className="text-primary hover:underline">
              Zaloguj się
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

