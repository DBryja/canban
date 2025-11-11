import { Elysia, t } from "elysia";
import { prisma } from "../../lib/prisma";
import { jwtPlugin } from "../../lib/jwt";
import { requireAuth } from "../../middleware/auth";
import { Role } from "@prisma/client";

export const projectRoutes = new Elysia({ prefix: "/projects" })
  .use(jwtPlugin)
  .post(
    "/",
    async ({ body, jwt, headers, set }) => {
      const authResult = await requireAuth(jwt, headers, set);
      if ("error" in authResult) {
        return authResult;
      }
      const { userId } = authResult;

      const { name, description, teamId } = body;
      
      // Normalize teamId - convert null/undefined to undefined
      const normalizedTeamId = teamId || undefined;

      let team;
      
      // If teamId is provided, verify user owns it
      if (normalizedTeamId) {
        team = await prisma.team.findUnique({
          where: { id: normalizedTeamId },
        });

        if (!team) {
          set.status = 404;
          return {
            error: "Not Found",
            message: "Team not found",
          };
        }

        if (team.ownerId !== userId) {
          set.status = 403;
          return {
            error: "Forbidden",
            message: "Only team owner can create projects",
          };
        }
      } else {
        // If no teamId provided, check if user owns a team
        const existingTeam = await prisma.team.findUnique({
          where: { ownerId: userId },
        });

        if (existingTeam) {
          // Use existing team
          team = existingTeam;
        } else {
          // Create a new team for the user
          try {
            team = await prisma.team.create({
              data: {
                name: "My Team",
                description: "Default team created automatically",
                ownerId: userId,
                members: {
                  create: {
                    userId,
                    role: Role.TeamOwner,
                  },
                },
              },
            });
          } catch (err) {
            set.status = 500;
            return {
              error: "Internal Server Error",
              message: "Failed to create team",
            };
          }
        }
      }

      try {
        const project = await prisma.project.create({
          data: {
            name,
            description: description || null,
            teamId: team.id,
          },
          select: {
            id: true,
            name: true,
            description: true,
            teamId: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        return {
          project,
          message: "Project created successfully",
        };
      } catch (err) {
        set.status = 500;
        return {
          error: "Internal Server Error",
          message: "Failed to create project",
        };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        teamId: t.Optional(t.Nullable(t.String())),
      }),
    }
  )
  .get("/", async ({ jwt, headers, set }) => {
    const authResult = await requireAuth(jwt, headers, set);
    if ("error" in authResult) {
      return authResult;
    }
    const { userId } = authResult;

    try {
      // Get user's teams to filter projects
      const userTeams = await prisma.userRole.findMany({
        where: { userId },
        select: { teamId: true },
      });
      const teamIds = userTeams.map((tr: { teamId: string }) => tr.teamId);

      // Also check if user owns any teams
      const ownedTeams = await prisma.team.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });
      const ownedTeamIds = ownedTeams.map((t) => t.id);

      // Combine all team IDs user has access to
      const allTeamIds = [...new Set([...teamIds, ...ownedTeamIds])];

      const projects = await prisma.project.findMany({
        where: {
          teamId: {
            in: allTeamIds,
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
          teamId: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return { projects };
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to fetch projects",
      };
    }
  })
  .get("/:id", async ({ params, set }) => {
    const { id } = params;

    try {
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          tasks: {
            select: {
              id: true,
              title: true,
              description: true,
              projectId: true,
              creatorId: true,
              mainTagId: true,
              // date field excluded as per requirements
              tags: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
              mainTag: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
              creator: {
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

      if (!project) {
        set.status = 404;
        return {
          error: "Not Found",
          message: "Project not found",
        };
      }

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        team: project.team,
        tasks: project.tasks,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to fetch project",
      };
    }
  });
