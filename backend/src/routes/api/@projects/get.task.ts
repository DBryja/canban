import { Elysia } from "elysia";
import { prisma } from "../../../lib/prisma";
import { jwtPlugin } from "../../../lib/jwt";
import { requireAuth } from "../../../middleware/auth";
import { checkProjectAccess } from "./helpers";
import { TaskResponse, ErrorResponse } from "../schemas";

export const getTask = new Elysia().use(jwtPlugin).get(
  "/:id/tasks/:taskId",
  async ({ params, jwt, headers, set }) => {
    const authResult = await requireAuth(jwt, headers, set);
    if ("error" in authResult) {
      return authResult;
    }
    const { userId } = authResult;
    const { id: projectId, taskId } = params;

    const access = await checkProjectAccess(userId, projectId);
    if (!access.hasAccess) {
      set.status = 403;
      return access.error;
    }

    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        set.status = 404;
        return {
          error: "Not Found",
          message: "Project not found",
        };
      }

      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          assignee: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      if (!task || task.projectId !== projectId) {
        set.status = 404;
        return {
          error: "Not Found",
          message: "Task not found",
        };
      }

      return {
        task: {
          id: task.id,
          title: task.title,
          description: task.description,
          number: task.number,
          assignee: task.assignee,
          comments: task.comments.map((comment) => ({
            id: comment.id,
            content: comment.content,
            author: comment.author,
            createdAt: comment.createdAt,
          })),
        },
      };
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to fetch task",
      };
    }
  },
  {
    response: {
      200: TaskResponse,
      401: ErrorResponse,
      403: ErrorResponse,
      404: ErrorResponse,
      500: ErrorResponse,
    },
    detail: {
      tags: ["projects"],
    },
  }
);
