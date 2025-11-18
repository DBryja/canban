import { Elysia, t } from "elysia";
import { prisma } from "../../../lib/prisma";
import { jwtPlugin } from "../../../lib/jwt";
import { requireAuth } from "../../../middleware/auth";
import { checkProjectAccess } from "./helpers";

export const patchTaskTags = new Elysia().use(jwtPlugin).patch(
  "/:id/tasks/:taskId/tags",
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

      if (body.tagIds && body.tagIds.length > 0) {
        const existingTags = await prisma.taskTag.findMany({
          where: {
            id: {
              in: body.tagIds,
            },
          },
        });

        if (existingTags.length !== body.tagIds.length) {
          set.status = 400;
          return {
            error: "Bad Request",
            message: "One or more tags not found",
          };
        }
      }

      const tagIdsToSet = [];
      for (const tagId of body.tagIds) {
        tagIdsToSet.push({ id: tagId });
      }
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          tags: {
            set: tagIdsToSet,
          },
        },
        include: {
          tags: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      });

      return {
        task: {
          id: updatedTask.id,
          tags: updatedTask.tags,
        },
        message: "Task tags updated successfully",
      };
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to update task tags",
      };
    }
  },
  {
    body: t.Object({
      tagIds: t.Array(t.String()),
    }),
  }
);
