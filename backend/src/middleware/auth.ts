import { JWTPayload } from "../lib/jwt";

const API_SECRET = process.env.API_SECRET || "SECRET";

/**
 * Legacy API secret guard (for backward compatibility)
 */
export function guardApi(
  headers: Record<string, string | undefined>,
  query: Record<string, string> | undefined,
  set: { status?: number | string }
): { error: string; message: string } | undefined {
  // Get secret from various sources
  const headerSecret =
    headers["x-api-secret"] || headers["authorization"]?.replace("Bearer ", "");
  const querySecret = query?.["api-secret"] || query?.["secret"];

  const secret = headerSecret || querySecret;

  if (!secret || secret !== API_SECRET) {
    set.status = 401;
    return {
      error: "Unauthorized",
      message: "Invalid or missing API secret",
    };
  }

  return undefined;
}

/**
 * JWT authentication guard
 * Extracts and verifies JWT token from Authorization header
 */
export async function requireAuth(
  jwt: any, // Elysia JWT plugin type
  headers: Record<string, string | undefined>,
  set: { status?: number | string }
): Promise<JWTPayload | { error: string; message: string }> {
  const authHeader = headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    set.status = 401;
    return {
      error: "Unauthorized",
      message: "Missing or invalid authorization header",
    };
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix
  const payload = await jwt.verify(token);

  if (!payload) {
    set.status = 401;
    return {
      error: "Unauthorized",
      message: "Invalid or expired token",
    };
  }

  // Extract userId and email from payload (Elysia JWT returns ClaimType)
  const userId = (payload as any).userId as string;
  const email = (payload as any).email as string;

  if (
    !userId ||
    !email ||
    typeof userId !== "string" ||
    typeof email !== "string"
  ) {
    set.status = 401;
    return {
      error: "Unauthorized",
      message: "Invalid token payload",
    };
  }

  return { userId, email };
}
