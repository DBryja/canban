import { Elysia } from "elysia";
import { prisma } from "../../../lib/prisma";
import { jwtPlugin } from "../../../lib/jwt";
import { requireAuth } from "../../../middleware/auth";

export const getList = new Elysia()
  .use(jwtPlugin)
  .get("/", async ({ jwt, headers, set }) => {
    const authResult = await requireAuth(jwt, headers, set);
    if ("error" in authResult) {
      return authResult;
    }
    const { userId } = authResult;
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      });

      let projects;

      if (user?.isAdmin) {
        projects = await prisma.project.findMany({
          select: {
            id: true,
            name: true,
            description: true,
            creatorId: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });
      } else {
        const projectMemberships = await prisma.projectMember.findMany({
          where: { userId },
          select: { projectId: true },
        });
        const projectIds = projectMemberships.map((pm) => pm.projectId);

        projects = await prisma.project.findMany({
          where: {
            id: {
              in: projectIds,
            },
          },
          select: {
            id: true,
            name: true,
            description: true,
            creatorId: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });
      }

      return { projects };
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to fetch projects",
      };
    }
  });
