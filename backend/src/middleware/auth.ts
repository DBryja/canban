import { Elysia } from "elysia";

const API_SECRET = process.env.API_SECRET || "SECRET";

export const authMiddleware = new Elysia().onBeforeHandle(({ headers, query, set }) => {
  // Get secret from various sources
  const headerSecret = headers["x-api-secret"] || headers["authorization"]?.replace("Bearer ", "");
  const querySecret = query?.["api-secret"] || query?.["secret"];

  const secret = headerSecret || querySecret;

  if (!secret || secret !== API_SECRET) {
    set.status = 401;
    return {
      error: "Unauthorized",
      message: "Invalid or missing API secret",
    };
  }
});
