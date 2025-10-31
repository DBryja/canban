const API_SECRET = process.env.API_SECRET || "SECRET";

export function guardApi(
  headers: Record<string, string | undefined>,
  query: Record<string, string> | undefined,
  set: { status?: number | string }
): { error: string; message: string } | undefined {
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

  return undefined;
}
