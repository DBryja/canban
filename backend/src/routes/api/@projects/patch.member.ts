import { Elysia, t } from "elysia";
import { prisma } from "../../../lib/prisma";
import { jwtPlugin } from "../../../lib/jwt";
import { requireAuth } from "../../../middleware/auth";
import { checkAdminAccess } from "./helpers";
import { MemberUpdateResponse, ErrorResponse } from "../schemas";

export const patchMember = new Elysia().use(jwtPlugin).patch(
  "/:id/members/:memberId",
  async ({ params, body, jwt, headers, set }) => {
    const authResult = await requireAuth(jwt, headers, set);
    if ("error" in authResult) {
      return authResult;
    }
    const { userId } = authResult;
    const adminCheck = await checkAdminAccess(userId);
    if (!adminCheck.hasAccess) {
      set.status = 403;
      return adminCheck.error;
    }

    const { id, memberId } = params;

    try {
      const project = await prisma.project.findUnique({
        where: { id },
      });

      if (!project) {
        set.status = 404;
        return {
          error: "Not Found",
          message: "Project not found",
        };
      }

      const member = await prisma.projectMember.findUnique({
        where: { id: memberId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      if (!member || member.projectId !== id) {
        set.status = 404;
        return {
          error: "Not Found",
          message: "Project member not found",
        };
      }

      const updatedMember = await prisma.projectMember.update({
        where: { id: memberId },
        data: {
          role: body.role,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      return {
        member: {
          id: updatedMember.id,
          role: updatedMember.role,
          user: updatedMember.user,
          createdAt: updatedMember.createdAt,
        },
        message: "Member role updated successfully",
      };
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to update project member",
      };
    }
  },
  {
    body: t.Object({
      role: t.Union([t.Literal("Guest"), t.Literal("Maintainer")]),
    }),
    response: {
      200: MemberUpdateResponse,
      401: ErrorResponse,
      403: ErrorResponse,
      404: ErrorResponse,
      500: ErrorResponse,
    },
    detail: {
      tags: ["projects"],
    },
  }
);
