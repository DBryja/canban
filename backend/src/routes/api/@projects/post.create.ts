import { Elysia, t } from "elysia";
import { prisma } from "../../../lib/prisma";
import { jwtPlugin } from "../../../lib/jwt";
import { requireAuth } from "../../../middleware/auth";
import { checkAdminAccess } from "./helpers";

export const postCreate = new Elysia().use(jwtPlugin).post(
  "/",
  async ({ body, jwt, headers, set }) => {
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

    const { name, description } = body;

    try {
      const project = await prisma.project.create({
        data: {
          name,
          description: description || null,
          creatorId: userId,
        },
        select: {
          id: true,
          name: true,
          description: true,
          creatorId: true,
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
    }),
  }
);
