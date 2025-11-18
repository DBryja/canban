import { Elysia, t } from "elysia";
import { prisma } from "../../../lib/prisma";
import { jwtPlugin } from "../../../lib/jwt";
import { requireAuth } from "../../../middleware/auth";
import { checkMaintainerAccess } from "./helpers";

export const patchTaskDescription = new Elysia().use(jwtPlugin).patch(
  "/:id/tasks/:taskId/description",
  async ({ params, body, jwt, headers, set }) => {
    const authResult = await requireAuth(jwt, headers, set);
    if ("error" in authResult) {
      return authResult;
    }
    const { userId } = authResult;
    const { id: projectId, taskId } = params;

    const access = await checkMaintainerAccess(userId, projectId);
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

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          description: body.description ?? null,
        },
        select: {
          id: true,
          description: true,
        },
      });

      return {
        task: updatedTask,
        message: "Task description updated successfully",
      };
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to update task description",
      };
    }
  },
  {
    body: t.Object({
      description: t.Optional(t.String()),
    }),
  }
);
