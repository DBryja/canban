import { Elysia } from "elysia";
import { prisma } from "../../../lib/prisma";
import { jwtPlugin } from "../../../lib/jwt";
import { requireAuth } from "../../../middleware/auth";
import { UserResponse, ErrorResponse } from "../schemas";

export const getMe = new Elysia().use(jwtPlugin).get(
  "/me",
  async ({ jwt, headers, set }) => {
    const authResult = await requireAuth(jwt, headers, set);
    if ("error" in authResult) {
      return authResult;
    }
    const { userId } = authResult;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        projectMembers: {
          select: {
            id: true,
            role: true,
            project: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      set.status = 404;
      return {
        error: "Not Found",
        message: "User not found",
      };
    }

    return {
      user,
    };
  },
  {
    response: {
      200: UserResponse,
      401: ErrorResponse,
      404: ErrorResponse,
    },
    detail: {
      tags: ["auth"],
    },
  }
);
