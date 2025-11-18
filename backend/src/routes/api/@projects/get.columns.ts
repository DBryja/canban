import { Elysia } from "elysia";
import { prisma } from "../../../lib/prisma";
import { jwtPlugin } from "../../../lib/jwt";
import { requireAuth } from "../../../middleware/auth";
import { checkProjectAccess } from "./helpers";

export const getColumns = new Elysia()
  .use(jwtPlugin)
  .get("/:id/columns", async ({ params, jwt, headers, set }) => {
    const authResult = await requireAuth(jwt, headers, set);
    if ("error" in authResult) {
      return authResult;
    }
    const { userId } = authResult;
    const { id } = params;

    try {
      const access = await checkProjectAccess(userId, id);
      if (!access.hasAccess) {
        set.status = 403;
        return access.error;
      }

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

      const columns = await prisma.projectColumn.findMany({
        where: { projectId: id },
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
        orderBy: {
          order: "asc",
        },
      });

      return { columns };
    } catch {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to fetch project columns",
      };
    }
  });
