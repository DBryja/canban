import { Elysia, t } from "elysia";
import { prisma } from "../../lib/prisma";
import { jwtPlugin } from "../../lib/jwt";
import { requireAuth } from "../../middleware/auth";

export const tagRoutes = new Elysia({ prefix: "/tags" })
  .use(jwtPlugin)
  .get("/", async ({ jwt, headers, set }) => {
    const authResult = await requireAuth(jwt, headers, set);
    if ("error" in authResult) {
      return authResult;
    }

    try {
      const tags = await prisma.taskTag.findMany({
        select: {
          id: true,
          name: true,
          color: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      return { tags };
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to fetch tags",
      };
    }
  });

