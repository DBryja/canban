import { Elysia, t } from "elysia";
import { prisma } from "../../../lib/prisma";
import { jwtPlugin } from "../../../lib/jwt";
import { requireAuth } from "../../../middleware/auth";
import { checkMaintainerAccess } from "./helpers";
import { TaskMoveResponse, ErrorResponse } from "../schemas";

export const patchTasksMove = new Elysia().use(jwtPlugin).patch(
  "/:id/tasks/:taskId/move",
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
      const { fromColumnId, toColumnId, newOrder } = body;

      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          tags: true,
          columnOrders: true,
        },
      });

      if (!task || task.projectId !== projectId) {
        set.status = 404;
        return {
          error: "Not Found",
          message: "Task not found",
        };
      }

      const fromColumn = await prisma.projectColumn.findUnique({
        where: { id: fromColumnId },
      });

      const toColumn = await prisma.projectColumn.findUnique({
        where: { id: toColumnId },
      });

      if (
        !fromColumn ||
        !toColumn ||
        fromColumn.projectId !== projectId ||
        toColumn.projectId !== projectId
      ) {
        set.status = 404;
        return {
          error: "Not Found",
          message: "Column not found",
        };
      }

      const fromTag = fromColumn.tagId;
      const toTag = toColumn.tagId;

      const hasFromTag = task.tags.some((tag) => tag.id === fromTag);
      const hasToTag = task.tags.some((tag) => tag.id === toTag);

      if (!hasFromTag) {
        set.status = 400;
        return {
          error: "Bad Request",
          message: "Task does not have the source column tag",
        };
      }

      const tagIdsToUpdate = [...task.tags.map((tag) => tag.id)];

      if (!hasToTag) {
        tagIdsToUpdate.push(toTag);
      }

      if (fromTag !== toTag) {
        tagIdsToUpdate.splice(tagIdsToUpdate.indexOf(fromTag), 1);
      }

      await prisma.$transaction([
        prisma.task.update({
          where: { id: taskId },
          data: {
            tags: {
              set: tagIdsToUpdate.map((tagId) => ({ id: tagId })),
            },
          },
        }),
        prisma.taskColumnOrder.deleteMany({
          where: {
            taskId: taskId,
            columnId: fromColumnId,
          },
        }),
        prisma.taskColumnOrder.upsert({
          where: {
            taskId_columnId: {
              taskId: taskId,
              columnId: toColumnId,
            },
          },
          update: {
            order: newOrder,
          },
          create: {
            taskId: taskId,
            columnId: toColumnId,
            order: newOrder,
          },
        }),
      ]);

      const tasksInToColumn = await prisma.taskColumnOrder.findMany({
        where: {
          columnId: toColumnId,
          taskId: { not: taskId },
          order: { gte: newOrder },
        },
      });

      if (tasksInToColumn.length > 0) {
        await Promise.all(
          tasksInToColumn.map((taskOrder) =>
            prisma.taskColumnOrder.update({
              where: { id: taskOrder.id },
              data: { order: taskOrder.order + 1 },
            })
          )
        );
      }

      return {
        message: "Task moved successfully",
      };
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to move task",
      };
    }
  },
  {
    body: t.Object({
      fromColumnId: t.String(),
      toColumnId: t.String(),
      newOrder: t.Number(),
    }),
    response: {
      200: TaskMoveResponse,
      400: ErrorResponse,
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
