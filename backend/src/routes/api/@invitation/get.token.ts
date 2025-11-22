import { Elysia } from "elysia";
import { prisma } from "../../../lib/prisma";
import {
  InvitationDetailResponse,
  InvitationExpiredResponse,
  ErrorResponse,
} from "../schemas";

export const getToken = new Elysia().get(
  "/:token",
  async ({ params, set }) => {
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
  },
  {
    response: {
      200: InvitationDetailResponse,
      404: ErrorResponse,
      410: InvitationExpiredResponse,
      500: ErrorResponse,
    },
    detail: {
      tags: ["invitation"],
    },
  }
);
