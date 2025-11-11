import { jwt } from "@elysiajs/jwt";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export const jwtPlugin = jwt({
  name: "jwt",
  secret: JWT_SECRET,
});

export interface JWTPayload {
  userId: string;
  email: string;
}
