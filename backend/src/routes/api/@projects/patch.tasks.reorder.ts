import { Elysia, t } from "elysia";
import { prisma } from "../../../lib/prisma";
import { jwtPlugin } from "../../../lib/jwt";
import { requireAuth } from "../../../middleware/auth";
import { checkMaintainerAccess } from "./helpers";

export const patchTasksReorder = new Elysia().use(jwtPlugin).patch(
  "/:id/tasks/reorder",
  async ({ params, body, jwt, headers, set }) => {
    const authResult = await requireAuth(jwt, headers, set);
    if ("error" in authResult) {
      return authResult;
    }
    const { userId } = authResult;
    const { id: projectId } = params;

    const access = await checkMaintainerAccess(userId, projectId);
    if (!access.hasAccess) {
      set.status = 403;
      return access.error;
    }

    try {
      const { columnId, taskOrders } = body;

      const column = await prisma.projectColumn.findUnique({
        where: { id: columnId },
      });

      if (!column || column.projectId !== projectId) {
        set.status = 404;
        return {
          error: "Not Found",
          message: "Column not found",
        };
      }

      const taskIds = [];
      for (const taskOrder of taskOrders) {
        taskIds.push(taskOrder.taskId);
      }

      const tasks = await prisma.task.findMany({
        where: {
          id: { in: taskIds },
          projectId: projectId,
        },
      });

      if (tasks.length !== taskIds.length) {
        set.status = 404;
        return {
          error: "Not Found",
          message:
            "One or more tasks not found or do not belong to this project",
        };
      }

      const updatePromises = [];
      for (const taskOrder of taskOrders) {
        updatePromises.push(
          prisma.taskColumnOrder.upsert({
            where: {
              taskId_columnId: {
                taskId: taskOrder.taskId,
                columnId: columnId,
              },
            },
            update: {
              order: taskOrder.order,
            },
            create: {
              taskId: taskOrder.taskId,
              columnId: columnId,
              order: taskOrder.order,
            },
          })
        );
      }
      await Promise.all(updatePromises);

      return {
        message: "Tasks reordered successfully",
      };
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to reorder tasks",
      };
    }
  },
  {
    body: t.Object({
      columnId: t.String(),
      taskOrders: t.Array(
        t.Object({
          taskId: t.String(),
          order: t.Number(),
        })
      ),
    }),
  }
);
