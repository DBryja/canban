"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  CheckCircle2,
  Users,
  KanbanSquare,
  MessageSquare,
  Shield,
  Zap,
  Database,
  Code,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: KanbanSquare,
      title: "Zarządzanie zadaniami",
      description:
        "Intuicyjny system kanban do organizacji i śledzenia postępów w projektach.",
    },
    {
      icon: Users,
      title: "Praca zespołowa",
      description:
        "Współpracuj z zespołem, przypisuj zadania i zarządzaj projektami w czasie rzeczywistym.",
    },
    {
      icon: MessageSquare,
      title: "Komentarze i komunikacja",
      description:
        "Dyskutuj nad zadaniami bezpośrednio w projekcie, śledź wszystkie aktualizacje.",
    },
    {
      icon: Shield,
      title: "Bezpieczeństwo",
      description:
        "Zaawansowane uwierzytelnianie JWT z systemem ról i kontrolą dostępu.",
    },
    {
      icon: Zap,
      title: "Asynchroniczne przetwarzanie",
      description: "Kolejki RabbitMQ do obsługi powiadomień i emaili w tle.",
    },
    {
      icon: Database,
      title: "Niezawodna baza danych",
      description:
        "PostgreSQL z Prisma ORM zapewniająca spójność i wydajność danych.",
    },
  ];

  const techStack = [
    {
      category: "Frontend",
      items: [
        "Next.js 16",
        "React 19",
        "TypeScript",
        "shadcn/ui",
        "Tailwind CSS",
      ],
    },
    {
      category: "Backend",
      items: ["Bun", "Elysia", "TypeScript", "REST API"],
    },
    {
      category: "Baza danych",
      items: ["PostgreSQL", "Prisma ORM"],
    },
    {
      category: "Infrastruktura",
      items: ["Docker", "RabbitMQ", "JWT"],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <CheckCircle2 className="size-4 text-primary" />
              <span className="text-sm font-medium">
                Nowoczesne zarządzanie projektami
              </span>
            </motion.div>
            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              TaskMaster
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Profesjonalna aplikacja SaaS do zarządzania projektami i
              zadaniami. Organizuj pracę, współpracuj z zespołem i osiągaj cele
              efektywniej.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Button asChild size="lg" className="text-base" variant="default">
                <Link href="/register">
                  Rozpocznij za darmo
                  <ArrowRight className="ml-2 size-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base">
                <Link href="/login">Zaloguj się</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-2xl mx-auto text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Wszystko czego potrzebujesz
            </h2>
            <p className="text-lg text-muted-foreground">
              Kompleksowe narzędzia do efektywnego zarządzania projektami
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="border">
                    <CardHeader>
                      <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <Icon className="size-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-24 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-2xl mx-auto text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Nowoczesny stack technologiczny
            </h2>
            <p className="text-lg text-muted-foreground">
              Zbudowany na najlepszych technologiach dla maksymalnej wydajności
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {techStack.map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="border h-full">
                  <CardHeader>
                    <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Code className="size-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{tech.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {tech.items.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="text-sm text-muted-foreground flex items-center gap-2"
                        >
                          <CheckCircle2 className="size-4 text-primary shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <Card className="max-w-4xl mx-auto border-2">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-3xl md:text-4xl mb-4">
                  Gotowy na start?
                </CardTitle>
                <CardDescription className="text-lg">
                  Dołącz do zespołów, które już używają TaskMaster do
                  zarządzania projektami
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="text-base"
                  variant="default"
                >
                  <Link href="/register">
                    Utwórz konto
                    <ArrowRight className="ml-2 size-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="text-base"
                >
                  <Link href="/login">Masz już konto?</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
