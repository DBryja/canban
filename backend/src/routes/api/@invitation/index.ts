import { Elysia } from "elysia";
import { postCreate } from "./post.create";
import { getToken } from "./get.token";
import { postAccept } from "./post.accept";
import { getProject } from "./get.project";

export const invitationRoutes = new Elysia({ prefix: "/invitations" })
  .use(postCreate)
  .use(getToken)
  .use(postAccept)
  .use(getProject);
