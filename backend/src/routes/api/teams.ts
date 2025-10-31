import { Elysia } from "elysia";
import { prisma } from "../../lib/prisma";
import { guardApi } from "../../middleware/auth";

export const teamRoutes = new Elysia({ prefix: "/teams" })
  .onBeforeHandle(({ headers, query, set }) => {
    const error = guardApi(headers, query, set);
    if (error) return error;
  })
  .get("/", async () => {
    try {
      const teams = await prisma.team.findMany({
        select: {
          id: true,
          name: true,
          description: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return { teams };
    } catch (err) {
      return {
        error: "Internal Server Error",
        message: "Failed to fetch teams",
      };
    }
  })
  .get("/:id", async ({ params, set }) => {
    const { id } = params;

    try {
      const team = await prisma.team.findUnique({
        where: { id },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!team) {
        set.status = 404;
        return {
          error: "Not Found",
          message: "Team not found",
        };
      }

      return {
        id: team.id,
        name: team.name,
        description: team.description,
        members: team.members.map((member) => ({
          id: member.id,
          role: member.role,
          user: member.user,
          createdAt: member.createdAt,
          updatedAt: member.updatedAt,
        })),
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      };
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to fetch team",
      };
    }
  });
