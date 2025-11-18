import { Elysia, t } from "elysia";
import { prisma } from "../../../lib/prisma";
import { jwtPlugin } from "../../../lib/jwt";
import { requireAuth } from "../../../middleware/auth";
import { checkProjectAccess } from "./helpers";

export const postTask = new Elysia().use(jwtPlugin).post(
  "/:id/tasks",
  async ({ params, body, jwt, headers, set }) => {
    const authResult = await requireAuth(jwt, headers, set);
    if ("error" in authResult) {
      return authResult;
    }
    const { userId } = authResult;
    const { id: projectId } = params;

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

      const maxTask = await prisma.task.findFirst({
        where: { projectId },
        orderBy: { number: "desc" },
      });

      const nextNumber = maxTask ? maxTask.number + 1 : 1;

      let mainTagId = body.mainTagId || null;
      let columnTagId = null;
      if (body.columnId && !mainTagId) {
        const column = await prisma.projectColumn.findUnique({
          where: { id: body.columnId },
        });
        if (column && column.projectId === projectId) {
          mainTagId = column.tagId;
          columnTagId = column.tagId;
        }
      }

      const tagIdsToConnect = body.tagIds ? [...body.tagIds] : [];
      if (columnTagId && !tagIdsToConnect.includes(columnTagId)) {
        tagIdsToConnect.push(columnTagId);
      }

      const task = await prisma.task.create({
        data: {
          title: body.title,
          description: body.description || null,
          projectId,
          creatorId: userId,
          number: nextNumber,
          mainTagId,
          tags:
            tagIdsToConnect.length > 0
              ? {
                  connect: tagIdsToConnect.map((tagId) => ({
                    id: tagId,
                  })),
                }
              : undefined,
        },
        include: {
          tags: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          assignee: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          columnOrders: {
            select: {
              id: true,
              columnId: true,
              order: true,
            },
          },
        },
      });

      if (body.columnId) {
        const column = await prisma.projectColumn.findUnique({
          where: { id: body.columnId },
        });

        if (column && column.projectId === projectId) {
          const existingOrders = await prisma.taskColumnOrder.findMany({
            where: { columnId: body.columnId },
            orderBy: { order: "desc" },
            take: 1,
          });

          const newOrder =
            existingOrders.length > 0 ? existingOrders[0].order + 1 : 0;

          await prisma.taskColumnOrder.create({
            data: {
              taskId: task.id,
              columnId: body.columnId,
              order: newOrder,
            },
          });
        }
      }

      return {
        task: {
          id: task.id,
          number: task.number,
          title: task.title,
          description: task.description,
          assignee: task.assignee,
          tags: task.tags,
          columnOrders: task.columnOrders,
        },
        message: "Task created successfully",
      };
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to create task",
      };
    }
  },
  {
    body: t.Object({
      title: t.String({ minLength: 1 }),
      description: t.Optional(t.String()),
      mainTagId: t.Optional(t.String()),
      tagIds: t.Optional(t.Array(t.String())),
      columnId: t.Optional(t.String()),
    }),
  }
);
