import { Elysia, t } from "elysia";
import { prisma } from "../../lib/prisma";
import { jwtPlugin } from "../../lib/jwt";
import { requireAuth } from "../../middleware/auth";
import { ProjectRole } from "@prisma/client";
import { randomBytes } from "crypto";

// Generate unique invitation token
function generateInvitationToken(): string {
  return randomBytes(32).toString("hex");
}

export const invitationRoutes = new Elysia({ prefix: "/invitations" })
  .use(jwtPlugin)
  // Create invitation link for a project (only admins)
  .post(
    "/",
    async ({ body, jwt, headers, set }) => {
      const authResult = await requireAuth(jwt, headers, set);
      if ("error" in authResult) {
        return authResult;
      }
      const { userId } = authResult;

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      });

      if (!user || !user.isAdmin) {
        set.status = 403;
        return {
          error: "Forbidden",
          message: "Only admins can create invitations",
        };
      }

      const { projectId, role, expiresInHours } = body;

      // Verify project exists and user created it (or is admin)
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        set.status = 404;
        return {
          error: "Not Found",
          message: "Project not found",
        };
      }

      // Calculate expiration time (default 24 hours)
      const expiresIn = expiresInHours || 24;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresIn);

      // Generate unique token
      const token = generateInvitationToken();

      try {
        const invitation = await prisma.projectInvitation.create({
          data: {
            token,
            projectId,
            role: role || ProjectRole.Guest,
            expiresAt,
          },
          include: {
            project: {
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
            project: invitation.project,
            role: invitation.role,
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
        projectId: t.String(),
        role: t.Optional(t.Union([t.Literal("Guest"), t.Literal("Maintainer")])),
        expiresInHours: t.Optional(t.Number({ minimum: 1, maximum: 168 })), // Max 7 days
      }),
    }
  )
  // Get invitation details by token (public endpoint)
  .get("/:token", async ({ params, set }) => {
    const { token } = params;

    try {
      const invitation = await prisma.projectInvitation.findUnique({
        where: { token },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              description: true,
              creator: {
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
            project: invitation.project,
            role: invitation.role,
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
            project: invitation.project,
            role: invitation.role,
            expiresAt: invitation.expiresAt,
          },
        };
      }

      return {
        invitation: {
          id: invitation.id,
          token: invitation.token,
          project: invitation.project,
          role: invitation.role,
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
        const invitation = await prisma.projectInvitation.findUnique({
          where: { token },
          include: {
            project: true,
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

        // Check if user is already a member of the project
        const existingMember = await prisma.projectMember.findUnique({
          where: {
            userId_projectId: {
              userId,
              projectId: invitation.projectId,
            },
          },
        });

        if (existingMember) {
          set.status = 409;
          return {
            error: "Conflict",
            message: "You are already a member of this project",
          };
        }

        // Check if user is trying to join their own project (as admin)
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { isAdmin: true },
        });

        if (user?.isAdmin && invitation.project.creatorId === userId) {
          set.status = 400;
          return {
            error: "Bad Request",
            message: "You are already the creator of this project",
          };
        }

        // Add user to project and mark invitation as used
        const [projectMember] = await prisma.$transaction([
          prisma.projectMember.create({
            data: {
              userId,
              projectId: invitation.projectId,
              role: invitation.role,
            },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
              project: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          }),
          prisma.projectInvitation.update({
            where: { id: invitation.id },
            data: { used: true },
          }),
        ]);

        return {
          membership: {
            id: projectMember.id,
            role: projectMember.role,
            user: projectMember.user,
            project: projectMember.project,
            createdAt: projectMember.createdAt,
          },
          message: "Successfully joined the project",
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
  // List invitations for a project (only admins)
  .get("/project/:projectId", async ({ params, jwt, headers, set }) => {
    const authResult = await requireAuth(jwt, headers, set);
    if ("error" in authResult) {
      return authResult;
    }
    const { userId } = authResult;

    const { projectId } = params;

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (!user || !user.isAdmin) {
      set.status = 403;
      return {
        error: "Forbidden",
        message: "Only admins can view invitations",
      };
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      set.status = 404;
      return {
        error: "Not Found",
        message: "Project not found",
      };
    }

    try {
      const invitations = await prisma.projectInvitation.findMany({
        where: { projectId },
        include: {
          project: {
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
          project: inv.project,
          role: inv.role,
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
