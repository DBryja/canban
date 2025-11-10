import { Elysia } from "elysia";
import { authRoutes } from "./api/auth";
import { invitationRoutes } from "./api/invitations";
import { projectRoutes } from "./api/projects";
import { teamRoutes } from "./api/teams";

export const routes = new Elysia({ prefix: "/api" })
  .get("/", () => {
    return { message: "TaskMaster API v1" };
  })
  .use(authRoutes)
  .use(invitationRoutes)
  .use(projectRoutes)
  .use(teamRoutes);
