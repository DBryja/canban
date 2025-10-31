import { Elysia } from "elysia";
import { projectRoutes } from "./api/projects";
import { teamRoutes } from "./api/teams";

export const routes = new Elysia({ prefix: "/api" })
  .get("/", () => {
    return { message: "TaskMaster API v1" };
  })
  .use(projectRoutes)
  .use(teamRoutes);
