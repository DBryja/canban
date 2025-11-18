import { Elysia, t } from "elysia";
import { prisma } from "../../../lib/prisma";
import { jwtPlugin } from "../../../lib/jwt";
import { requireAuth } from "../../../middleware/auth";
import { checkMaintainerAccess } from "./helpers";

export const postColumn = new Elysia().use(jwtPlugin).post(
  "/:id/columns",
  async ({ params, body, jwt, headers, set }) => {
    const authResult = await requireAuth(jwt, headers, set);
    if ("error" in authResult) {
      return authResult;
    }
    const { userId } = authResult;
    const { id } = params;

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

      const tag = await prisma.taskTag.findUnique({
        where: { id: body.tagId },
      });

      if (!tag) {
        set.status = 404;
        return {
          error: "Not Found",
          message: "Tag not found",
        };
      }

      const existingColumn = await prisma.projectColumn.findUnique({
        where: {
          projectId_tagId: {
            projectId: id,
            tagId: body.tagId,
          },
        },
      });

      if (existingColumn) {
        set.status = 400;
        return {
          error: "Bad Request",
          message: "Column with this tag already exists",
        };
      }

      const maxOrderColumn = await prisma.projectColumn.findFirst({
        where: { projectId: id },
        orderBy: { order: "desc" },
      });

      const newOrder = maxOrderColumn ? maxOrderColumn.order + 1 : 0;

      const column = await prisma.projectColumn.create({
        data: {
          projectId: id,
          tagId: body.tagId,
          order: body.order !== undefined ? body.order : newOrder,
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
        column,
        message: "Column created successfully",
      };
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to create column",
      };
    }
  },
  {
    body: t.Object({
      tagId: t.String(),
      order: t.Optional(t.Number()),
    }),
  }
);
