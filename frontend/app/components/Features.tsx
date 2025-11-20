"use client";

import { motion } from "motion/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Users,
  KanbanSquare,
  MessageSquare,
  Shield,
  Zap,
  Database,
  type LucideIcon,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
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

export default function Features() {
  return (
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
  );
}
