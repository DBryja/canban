import { Elysia } from "elysia";
import { prisma } from "../../lib/prisma";
import { authMiddleware } from "../../middleware/auth";

export const projectRoutes = new Elysia({ prefix: "/projects" })
  .use(authMiddleware)
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
