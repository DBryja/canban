import { Elysia } from "elysia";
import { jwtPlugin } from "../lib/jwt";
import { requireAuth } from "./auth";

export const authGuard = new Elysia({ name: "authGuard" })
  .use(jwtPlugin)
  .derive(async ({ jwt, headers, set }) => {
    const authResult = await requireAuth(jwt, headers, set);
    if ("error" in authResult) {
      set.status = 401;
      throw new Error(authResult.message);
    }
    return {
      userId: authResult.userId,
      email: authResult.email,
    };
  });

export interface AuthContext {
  userId: string;
  email: string;
}
