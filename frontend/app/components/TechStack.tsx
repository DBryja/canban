"use client";

import { motion } from "motion/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { CheckCircle2, Code } from "lucide-react";

interface TechCategory {
  category: string;
  items: string[];
}

const techStack: TechCategory[] = [
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

export default function TechStack() {
  return (
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
  );
}
