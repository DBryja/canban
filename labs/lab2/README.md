# Kod dostępny pod:

https://github.com/DBryja/canban/tree/backend-base/backend/src

## Przykładowy Route API

```ts
import { Elysia } from "elysia";
import { prisma } from "../../lib/prisma";
import { guardApi } from "../../middleware/auth";

export const projectRoutes = new Elysia({ prefix: "/projects" })
  .onBeforeHandle(({ headers, query, set }) => {
    const error = guardApi(headers, query, set);
    if (error) return error;
  })
  .get("/", async () => {
    try {
      const projects = await prisma.project.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          teamId: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return { projects };
    } catch (err) {
      return {
        error: "Internal Server Error",
        message: "Failed to fetch projects",
      };
    }
  })
  .get("/:id", async ({ params, set }) => {
    const { id } = params;

    try {
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          tasks: {
            select: {
              id: true,
              title: true,
              description: true,
              projectId: true,
              creatorId: true,
              mainTagId: true,
              // date field excluded as per requirements
              tags: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
              mainTag: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
              creator: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!project) {
        set.status = 404;
        return {
          error: "Not Found",
          message: "Project not found",
        };
      }

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        team: project.team,
        tasks: project.tasks,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to fetch project",
      };
    }
  });
```

## Basic API Guard - na potrzeby prezentacji przyjmuje headersy, token albo search param

```ts
export function guardApi(
  headers: Record<string, string | undefined>,
  query: Record<string, string> | undefined,
  set: { status?: number | string }
): { error: string; message: string } | undefined {
  // Get secret from various sources
  const headerSecret = headers["x-api-secret"] || headers["authorization"]?.replace("Bearer ", "");
  const querySecret = query?.["api-secret"] || query?.["secret"];

  const secret = headerSecret || querySecret;

  if (!secret || secret !== API_SECRET) {
    set.status = 401;
    return {
      error: "Unauthorized",
      message: "Invalid or missing API secret",
    };
  }

  return undefined;
}
```

![api-success](https://github.com/DBryja/canban/tree/backend-base/labs/lab2/api-success.jpg)
![api-error-auht](https://github.com/DBryja/canban/tree/backend-base/labs/lab2/api-error.jpg)
![api-error-id](https://github.com/DBryja/canban/tree/backend-base/labs/lab2/api-error-id.jpg)
