import { Elysia, t } from "elysia";
import { prisma } from "../../../lib/prisma";
import { jwtPlugin } from "../../../lib/jwt";
import { requireAuth } from "../../../middleware/auth";
import { checkProjectAccess } from "./helpers";

export const postTaskComment = new Elysia().use(jwtPlugin).post(
  "/:id/tasks/:taskId/comments",
  async ({ params, body, jwt, headers, set }) => {
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
      });

      if (!task || task.projectId !== projectId) {
        set.status = 404;
        return {
          error: "Not Found",
          message: "Task not found",
        };
      }

      const comment = await prisma.comment.create({
        data: {
          content: body.content,
          taskId: taskId,
          authorId: userId,
        },
        include: {
          author: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      return {
        comment: {
          id: comment.id,
          content: comment.content,
          author: comment.author,
          createdAt: comment.createdAt,
        },
        message: "Comment created successfully",
      };
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to create comment",
      };
    }
  },
  {
    body: t.Object({
      content: t.String({ minLength: 1 }),
    }),
  }
);
