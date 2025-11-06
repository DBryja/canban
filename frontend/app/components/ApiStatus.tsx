"use client";

import { useEffect, useState } from "react";
import axios from "axios";

// Use Next.js API route in development, or direct URL in production
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function ApiStatus() {
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
    <div className="bg-card rounded-lg border p-6">
      <h2 className="text-2xl font-semibold mb-4">Status</h2>
      {loading ? (
        <p>Ładowanie...</p>
      ) : status ? (
        <div>
          <p className="text-green-600">✅ {status.message}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Backend API jest połączony i działa poprawnie
          </p>
        </div>
      ) : (
        <p className="text-red-600">❌ Nie można połączyć się z API</p>
      )}
    </div>
  );
}

