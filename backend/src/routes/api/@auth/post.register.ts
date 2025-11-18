import { Elysia, t } from "elysia";
import { prisma } from "../../../lib/prisma";
import { jwtPlugin } from "../../../lib/jwt";
import { hashPassword } from "../../../lib/auth";
import { AuthSuccessResponse, ErrorResponse } from "../schemas";

export const postRegister = new Elysia().use(jwtPlugin).post(
  "/register",
  async ({ body, jwt, set }) => {
    const { email, password, name } = body;

    if (!email || !password) {
      set.status = 400;
      return {
        error: "Bad Request",
        message: "Email and password are required",
      };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      set.status = 409;
      return {
        error: "Conflict",
        message: "User with this email already exists",
      };
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    const token = await jwt.sign({
      userId: user.id,
      email: user.email,
    });

    return {
      user,
      token,
      message: "User registered successfully",
    };
  },
  {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 6 }),
      name: t.Optional(t.String()),
    }),
    response: {
      200: AuthSuccessResponse,
      400: ErrorResponse,
      409: ErrorResponse,
    },
    detail: {
      tags: ["auth"],
    },
  }
);
