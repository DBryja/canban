import { Elysia } from "elysia";

export const routes = new Elysia({ prefix: "/api" }).get("/", () => {
  return { message: "TaskMaster API v1" };
});
