import { Elysia, t } from "elysia";
import { authRoutes } from "./api/@auth";
import { invitationRoutes } from "./api/@invitation";
import { projectRoutes } from "./api/@projects";
import { tagRoutes } from "./api/@tags";

export const routes = new Elysia({ prefix: "/api" })
  .get(
    "/",
    () => {
      return { message: "TaskMaster API v1" };
    },
    {
      response: {
        200: t.Object({
          message: t.String(),
        }),
      },
    }
  )
  .use(authRoutes)
  .use(invitationRoutes)
  .use(projectRoutes)
  .use(tagRoutes);
