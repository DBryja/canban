import { Elysia, t } from "elysia";
import { prisma } from "../../../lib/prisma";
import { jwtPlugin } from "../../../lib/jwt";
import { requireAuth } from "../../../middleware/auth";
import { checkMaintainerAccess } from "./helpers";
import { ColumnUpdateResponse, ErrorResponse } from "../schemas";

export const patchColumn = new Elysia().use(jwtPlugin).patch(
  "/:id/columns/:columnId",
  async ({ params, body, jwt, headers, set }) => {
    const authResult = await requireAuth(jwt, headers, set);
    if ("error" in authResult) {
      return authResult;
    }
    const { userId } = authResult;
    const { id, columnId } = params;

    const access = await checkMaintainerAccess(userId, id);
    if (!access.hasAccess) {
      set.status = 403;
      return access.error;
    }

    try {
      const project = await prisma.project.findUnique({
        where: { id },
      });

      if (!project) {
        set.status = 404;
        return {
          error: "Not Found",
          message: "Project not found",
        };
      }

      const column = await prisma.projectColumn.findUnique({
        where: { id: columnId },
      });

      if (!column || column.projectId !== id) {
        set.status = 404;
        return {
          error: "Not Found",
          message: "Column not found",
        };
      }

      const updatedColumn = await prisma.projectColumn.update({
        where: { id: columnId },
        data: {
          order: body.order !== undefined ? body.order : column.order,
          tagId: body.tagId !== undefined ? body.tagId : column.tagId,
        },
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      });

      return {
        column: updatedColumn,
        message: "Column updated successfully",
      };
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to update column",
      };
    }
  },
  {
    body: t.Object({
      order: t.Optional(t.Number()),
      tagId: t.Optional(t.String()),
    }),
    response: {
      200: ColumnUpdateResponse,
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
