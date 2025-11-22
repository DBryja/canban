import { Elysia } from "elysia";
import { prisma } from "../../../lib/prisma";
import { jwtPlugin } from "../../../lib/jwt";
import { requireAuth } from "../../../middleware/auth";
import { InvitationsListResponse, ErrorResponse } from "../schemas";

export const getProject = new Elysia().use(jwtPlugin).get(
  "/project/:projectId",
  async ({ params, jwt, headers, set }) => {
    const authResult = await requireAuth(jwt, headers, set);
    if ("error" in authResult) {
      return authResult;
    }
    const { userId } = authResult;
    const { projectId } = params;

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
          project: {
            id: inv.project.id,
            name: inv.project.name,
            description: null,
          },
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
  },
  {
    response: {
      200: InvitationsListResponse,
      401: ErrorResponse,
      403: ErrorResponse,
      404: ErrorResponse,
      500: ErrorResponse,
    },
    detail: {
      tags: ["invitation"],
    },
  }
);
