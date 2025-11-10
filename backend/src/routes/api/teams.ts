import { Elysia, t } from "elysia";
import { prisma } from "../../lib/prisma";
import { jwtPlugin } from "../../lib/jwt";
import { requireAuth } from "../../middleware/auth";
import { Role } from "@prisma/client";

export const teamRoutes = new Elysia({ prefix: "/teams" })
  .use(jwtPlugin)
  // Create team (only for authenticated users who don't own a team yet)
  .post(
    "/",
    async ({ body, jwt, headers, set }) => {
      // Authenticate user
      const authResult = await requireAuth(jwt, headers, set);
      if ("error" in authResult) {
        return authResult;
      }
      const { userId } = authResult;

      const { name, description } = body;

      // Check if user already owns a team
      const existingTeam = await prisma.team.findUnique({
        where: { ownerId: userId },
      });

      if (existingTeam) {
        set.status = 409;
        return {
          error: "Conflict",
          message: "User can only own one team",
        };
      }

      try {
        // Create team with owner
        const team = await prisma.team.create({
          data: {
            name,
            description: description || null,
            ownerId: userId,
            members: {
              create: {
                userId,
                role: Role.TeamOwner,
              },
            },
          },
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

        return {
          team: {
            id: team.id,
            name: team.name,
            description: team.description,
            owner: team.owner,
            members: team.members.map((member) => ({
              id: member.id,
              role: member.role,
              user: member.user,
            })),
            createdAt: team.createdAt,
            updatedAt: team.updatedAt,
          },
          message: "Team created successfully",
        };
      } catch (err) {
        set.status = 500;
        return {
          error: "Internal Server Error",
          message: "Failed to create team",
        };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
      }),
    }
  )
  // Get all teams (for authenticated users, shows their teams; otherwise all teams)
  .get("/", async ({ jwt, headers, set }) => {
    try {
      // Try to authenticate, but don't fail if not authenticated
      const authHeader = headers["authorization"];
      let userId: string | null = null;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const payload = await jwt.verify(token);
        if (payload) {
          userId = payload.userId;
        }
      }

      if (userId) {
        // Return teams where user is a member or owner
        const teams = await prisma.team.findMany({
          where: {
            OR: [
              { ownerId: userId },
              { members: { some: { userId } } },
            ],
          },
          select: {
            id: true,
            name: true,
            description: true,
            owner: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return { teams };
      } else {
        // Return all teams (public)
        const teams = await prisma.team.findMany({
          select: {
            id: true,
            name: true,
            description: true,
            owner: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return { teams };
      }
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to fetch teams",
      };
    }
  })
  // Get team by ID
  .get("/:id", async ({ params, set }) => {
    const { id } = params;

    try {
      const team = await prisma.team.findUnique({
        where: { id },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
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
        owner: team.owner,
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
  })
  // Get current user's team (if they own one)
  .get("/my/team", async ({ jwt, headers, set }) => {
    const authResult = await requireAuth(jwt, headers, set);
    if ("error" in authResult) {
      return authResult;
    }
    const { userId } = authResult;

    try {
      const team = await prisma.team.findUnique({
        where: { ownerId: userId },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
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
          message: "You don't own any team",
        };
      }

      return {
        team: {
          id: team.id,
          name: team.name,
          description: team.description,
          owner: team.owner,
          members: team.members.map((member) => ({
            id: member.id,
            role: member.role,
            user: member.user,
            createdAt: member.createdAt,
            updatedAt: member.updatedAt,
          })),
          createdAt: team.createdAt,
          updatedAt: team.updatedAt,
        },
      };
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to fetch team",
      };
    }
  });
