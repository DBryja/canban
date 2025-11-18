import { Elysia } from "elysia";
import { prisma } from "../../../lib/prisma";
import { jwtPlugin } from "../../../lib/jwt";
import { requireAuth } from "../../../middleware/auth";
import { checkAdminAccess } from "./helpers";

export const deleteMember = new Elysia()
  .use(jwtPlugin)
  .delete("/:id/members/:memberId", async ({ params, jwt, headers, set }) => {
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
      });

      if (!member || member.projectId !== id) {
        set.status = 404;
        return {
          error: "Not Found",
          message: "Project member not found",
        };
      }

      await prisma.projectMember.delete({
        where: { id: memberId },
      });

      return {
        message: "Member removed successfully",
      };
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to remove project member",
      };
    }
  });
