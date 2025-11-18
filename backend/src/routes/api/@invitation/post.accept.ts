import { Elysia } from "elysia";
import { prisma } from "../../../lib/prisma";
import { jwtPlugin } from "../../../lib/jwt";
import { requireAuth } from "../../../middleware/auth";

export const postAccept = new Elysia()
  .use(jwtPlugin)
  .post("/:token/accept", async ({ params, jwt, headers, set }) => {
    const authResult = await requireAuth(jwt, headers, set);
    if ("error" in authResult) {
      return authResult;
    }
    const { userId } = authResult;
    const { token } = params;

    try {
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

      if (new Date() > invitation.expiresAt) {
        set.status = 410;
        return {
          error: "Gone",
          message: "Invitation has expired",
        };
      }

      if (invitation.used) {
        set.status = 409;
        return {
          error: "Conflict",
          message: "Invitation has already been used",
        };
      }

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
  });
