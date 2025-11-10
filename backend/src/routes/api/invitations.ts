import { Elysia, t } from "elysia";
import { prisma } from "../../lib/prisma";
import { jwtPlugin } from "../../lib/jwt";
import { requireAuth } from "../../middleware/auth";
import { Role } from "@prisma/client";
import { randomBytes } from "crypto";

// Generate unique invitation token
function generateInvitationToken(): string {
  return randomBytes(32).toString("hex");
}

export const invitationRoutes = new Elysia({ prefix: "/invitations" })
  .use(jwtPlugin)
  // Create invitation link for a team (only team owner)
  .post(
    "/",
    async ({ body, jwt, headers, set }) => {
      const authResult = await requireAuth(jwt, headers, set);
      if ("error" in authResult) {
        return authResult;
      }
      const { userId } = authResult;

      const { teamId, expiresInHours } = body;

      // Verify user owns the team
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          owner: true,
        },
      } as any);

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
          message: "Only team owner can create invitations",
        };
      }

      // Calculate expiration time (default 24 hours)
      const expiresIn = expiresInHours || 24;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresIn);

      // Generate unique token
      const token = generateInvitationToken();

      try {
        const invitation = await prisma.teamInvitation.create({
          data: {
            token,
            teamId,
            expiresAt,
          },
          include: {
            team: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        });

        return {
          invitation: {
            id: invitation.id,
            token: invitation.token,
            team: invitation.team,
            expiresAt: invitation.expiresAt,
            createdAt: invitation.createdAt,
          },
          invitationLink: `/invitations/${invitation.token}`,
          message: "Invitation created successfully",
        };
      } catch (err) {
        set.status = 500;
        return {
          error: "Internal Server Error",
          message: "Failed to create invitation",
        };
      }
    },
    {
      body: t.Object({
        teamId: t.String(),
        expiresInHours: t.Optional(t.Number({ minimum: 1, maximum: 168 })), // Max 7 days
      }),
    }
  )
  // Get invitation details by token (public endpoint)
  .get("/:token", async ({ params, set }) => {
    const { token } = params;

    try {
      const invitation = await prisma.teamInvitation.findUnique({
        where: { token },
        include: {
          team: {
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
            },
          },
        },
      });

      if (!invitation) {
        set.status = 404;
        return {
          error: "Not Found",
          message: "Invitation not found",
        };
      }

      // Check if invitation is expired
      if (new Date() > invitation.expiresAt) {
        set.status = 410;
        return {
          error: "Gone",
          message: "Invitation has expired",
          invitation: {
            id: invitation.id,
            team: invitation.team,
            expiresAt: invitation.expiresAt,
          },
        };
      }

      // Check if invitation was already used
      if (invitation.used) {
        set.status = 410;
        return {
          error: "Gone",
          message: "Invitation has already been used",
          invitation: {
            id: invitation.id,
            team: invitation.team,
            expiresAt: invitation.expiresAt,
          },
        };
      }

      return {
        invitation: {
          id: invitation.id,
          token: invitation.token,
          team: invitation.team,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt,
        },
      };
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to fetch invitation",
      };
    }
  })
  // Accept invitation (only for authenticated users)
  .post(
    "/:token/accept",
    async ({ params, jwt, headers, set }) => {
      const authResult = await requireAuth(jwt, headers, set);
      if ("error" in authResult) {
        return authResult;
      }
      const { userId } = authResult;

      const { token } = params;

      try {
        // Find invitation
        const invitation = await prisma.teamInvitation.findUnique({
          where: { token },
          include: {
            team: true,
          },
        });

        if (!invitation) {
          set.status = 404;
          return {
            error: "Not Found",
            message: "Invitation not found",
          };
        }

        // Check if invitation is expired
        if (new Date() > invitation.expiresAt) {
          set.status = 410;
          return {
            error: "Gone",
            message: "Invitation has expired",
          };
        }

        // Check if invitation was already used
        if (invitation.used) {
          set.status = 409;
          return {
            error: "Conflict",
            message: "Invitation has already been used",
          };
        }

        // Check if user is already a member of the team
        const existingMember = await prisma.userRole.findUnique({
          where: {
            userId_teamId: {
              userId,
              teamId: invitation.teamId,
            },
          },
        });

        if (existingMember) {
          set.status = 409;
          return {
            error: "Conflict",
            message: "You are already a member of this team",
          };
        }

        // Check if user is trying to join their own team
        if (invitation.team.ownerId === userId) {
          set.status = 400;
          return {
            error: "Bad Request",
            message: "You cannot join your own team",
          };
        }

        // Add user to team and mark invitation as used
        const [userRole] = await prisma.$transaction([
          prisma.userRole.create({
            data: {
              userId,
              teamId: invitation.teamId,
              role: Role.TeamMember,
            },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
              team: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          }),
          prisma.teamInvitation.update({
            where: { id: invitation.id },
            data: { used: true },
          }),
        ]);

        return {
          membership: {
            id: userRole.id,
            role: userRole.role,
            user: userRole.user,
            team: userRole.team,
            createdAt: userRole.createdAt,
          },
          message: "Successfully joined the team",
        };
      } catch (err) {
        set.status = 500;
        return {
          error: "Internal Server Error",
          message: "Failed to accept invitation",
        };
      }
    }
  )
  // List invitations for a team (only team owner)
  .get("/team/:teamId", async ({ params, jwt, headers, set }) => {
    const authResult = await requireAuth(jwt, headers, set);
    if ("error" in authResult) {
      return authResult;
    }
    const { userId } = authResult;

    const { teamId } = params;

    // Verify user owns the team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
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
        message: "Only team owner can view invitations",
      };
    }

    try {
      const invitations = await prisma.teamInvitation.findMany({
        where: { teamId },
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return {
        invitations: invitations.map((inv) => ({
          id: inv.id,
          token: inv.token,
          team: inv.team,
          expiresAt: inv.expiresAt,
          used: inv.used,
          createdAt: inv.createdAt,
          isValid: !inv.used && new Date() < inv.expiresAt,
        })),
      };
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to fetch invitations",
      };
    }
  });

