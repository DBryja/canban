import { Elysia, t } from "elysia";
import { prisma } from "../../lib/prisma";
import { jwtPlugin, JWTPayload } from "../../lib/jwt";
import { hashPassword, verifyPassword } from "../../lib/auth";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(jwtPlugin)
  .post(
    "/register",
    async ({ body, jwt, set }) => {
      const { email, password, name } = body;

      // Validate input
      if (!email || !password) {
        set.status = 400;
        return {
          error: "Bad Request",
          message: "Email and password are required",
        };
      }

      // Check if user already exists
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

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
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

      // Generate JWT token
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
    }
  )
  .post(
    "/login",
    async ({ body, jwt, set }) => {
      const { email, password } = body;

      // Validate input
      if (!email || !password) {
        set.status = 400;
        return {
          error: "Bad Request",
          message: "Email and password are required",
        };
      }

      // Find user
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

      // Verify password
      const isValidPassword = await verifyPassword(password, user.password);

      if (!isValidPassword) {
        set.status = 401;
        return {
          error: "Unauthorized",
          message: "Invalid email or password",
        };
      }

      // Generate JWT token
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
    }
  )
  .get("/me", async ({ jwt, headers, set }) => {
    const authHeader = headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      set.status = 401;
      return {
        error: "Unauthorized",
        message: "Missing authorization header",
      };
    }

    const token = authHeader.substring(7);
    const payload = await jwt.verify(token);

    if (!payload) {
      set.status = 401;
      return {
        error: "Unauthorized",
        message: "Invalid or expired token",
      };
    }

    // Extract userId from payload (jwt.verify returns ClaimType)
    const userId = (payload as any).userId as string;
    
    if (!userId || typeof userId !== "string") {
      set.status = 401;
      return {
        error: "Unauthorized",
        message: "Invalid token payload",
      };
    }

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
  });

