import { Elysia } from "elysia";
import { prisma } from "../../../lib/prisma";
import { jwtPlugin } from "../../../lib/jwt";
import { requireAuth } from "../../../middleware/auth";
import { checkMaintainerAccess } from "./helpers";

export const deleteColumn = new Elysia()
  .use(jwtPlugin)
  .delete("/:id/columns/:columnId", async ({ params, jwt, headers, set }) => {
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

      await prisma.projectColumn.delete({
        where: { id: columnId },
      });

      return {
        message: "Column deleted successfully",
      };
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to delete column",
      };
    }
  });
