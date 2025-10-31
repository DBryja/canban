import { useEffect, useState } from "react";
import axios from "axios";

// Use Vite proxy in development, or direct URL in production
const API_URL = import.meta.env.DEV ? "/api" : import.meta.env.VITE_API_URL || "http://localhost:3001";

function App() {
  const [status, setStatus] = useState<{ message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_URL}/health`)
      .then((response: { data: { message: string } }) => {
        setStatus(response.data);
        setLoading(false);
      })
      .catch((error: unknown) => {
        console.error("Error connecting to API:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">TaskMaster 🧩</h1>
          <p className="text-muted-foreground mb-8">Aplikacja do zarządzania projektami i zadaniami</p>

          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-2xl font-semibold mb-4">Status</h2>
            {loading ? (
              <p>Ładowanie...</p>
            ) : status ? (
              <div>
                <p className="text-green-600">✅ {status.message}</p>
                <p className="text-sm text-muted-foreground mt-2">Backend API jest połączony i działa poprawnie</p>
              </div>
            ) : (
              <p className="text-red-600">❌ Nie można połączyć się z API</p>
            )}
          </div>

          <div className="mt-8 bg-card rounded-lg border p-6">
            <h2 className="text-2xl font-semibold mb-4">Następne kroki</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Dodaj routing z React Router</li>
              <li>Utwórz komponenty shadcn/ui</li>
              <li>Zaimplementuj uwierzytelnianie</li>
              <li>Dodaj zarządzanie stanem</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
