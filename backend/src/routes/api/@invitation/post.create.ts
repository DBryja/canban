import { Elysia, t } from "elysia";
import { prisma } from "../../../lib/prisma";
import { jwtPlugin } from "../../../lib/jwt";
import { requireAuth } from "../../../middleware/auth";
import { randomBytes } from "crypto";

function generateInvitationToken() {
  return randomBytes(32).toString("hex");
}

export const postCreate = new Elysia().use(jwtPlugin).post(
  "/",
  async ({ body, jwt, headers, set }) => {
    const authResult = await requireAuth(jwt, headers, set);
    if ("error" in authResult) {
      return authResult;
    }
    const { userId } = authResult;
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

    const expiresIn = expiresInHours || 24;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresIn);

    const token = generateInvitationToken();

    try {
      const invitation = await prisma.projectInvitation.create({
        data: {
          token,
          projectId,
          role: role || "Guest",
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
      expiresInHours: t.Optional(t.Number({ minimum: 1, maximum: 168 })),
    }),
  }
);
