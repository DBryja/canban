import { Elysia, t } from "elysia";
import { prisma } from "../../../lib/prisma";
import { jwtPlugin } from "../../../lib/jwt";
import { requireAuth } from "../../../middleware/auth";
import { checkMaintainerAccess, checkProjectAccess } from "./helpers";

export const patchTaskAssignee = new Elysia().use(jwtPlugin).patch(
  "/:id/tasks/:taskId/assignee",
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

      if (body.assigneeId) {
        const assignee = await prisma.user.findUnique({
          where: { id: body.assigneeId },
        });

        if (!assignee) {
          set.status = 404;
          return {
            error: "Not Found",
            message: "Assignee not found",
          };
        }

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { isAdmin: true },
        });

        const isProjectMember = await prisma.projectMember.findUnique({
          where: {
            userId_projectId: {
              userId: body.assigneeId,
              projectId,
            },
          },
        });

        if (!isProjectMember && !user?.isAdmin) {
          set.status = 400;
          return {
            error: "Bad Request",
            message: "Assignee must be a project member",
          };
        }
      }

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          assigneeId: body.assigneeId ?? null,
        },
        include: {
          assignee: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      return {
        task: {
          id: updatedTask.id,
          assignee: updatedTask.assignee,
        },
        message: "Task assignee updated successfully",
      };
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to update task assignee",
      };
    }
  },
  {
    body: t.Object({
      assigneeId: t.Optional(t.String()),
    }),
  }
);
