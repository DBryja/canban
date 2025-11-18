import { Elysia, t } from "elysia";
import { prisma } from "../../../lib/prisma";
import { jwtPlugin } from "../../../lib/jwt";
import { verifyPassword } from "../../../lib/auth";
import { AuthSuccessResponse, ErrorResponse, UserSchema } from "../schemas";

export const postLogin = new Elysia().use(jwtPlugin).post(
  "/login",
  async ({ body, jwt, set }) => {
    const { email, password } = body;

    if (!email || !password) {
      set.status = 400;
      return {
        error: "Bad Request",
        message: "Email and password are required",
      };
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      set.status = 401;
      return {
        error: "Unauthorized",
        message: "Invalid email or password",
      };
    }

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      set.status = 401;
      return {
        error: "Unauthorized",
        message: "Invalid email or password",
      };
    }

    const token = await jwt.sign({
      userId: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      token,
      message: "Login successful",
    };
  },
  {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String(),
    }),
    response: {
      200: AuthSuccessResponse,
      400: ErrorResponse,
      401: ErrorResponse,
    },
    detail: {
      tags: ["auth"],
    },
  }
);
