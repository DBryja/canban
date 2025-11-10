import ApiStatus from "@/components/ApiStatus";
import Link from "@/components/Link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">TaskMaster 🧩</h1>
          <p className="text-muted-foreground mb-8">
            Aplikacja do zarządzania projektami i zadaniami
          </p>

          <ApiStatus />

          <div className="mt-8 bg-card rounded-lg border p-6">
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ">
              <li>
                <Link href='/auth-test'>Test Autentykacji</Link>
              </li>
              <li >
                <Link href='{{api}}/projects' target='_blank'>Projekty</Link>
              </li>
              <li>
                <Link href='{{api}}/teams' target='_blank'>Zespoły</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
