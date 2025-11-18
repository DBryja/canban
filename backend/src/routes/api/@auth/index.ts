import { Elysia } from "elysia";
import { postRegister } from "./post.register";
import { postLogin } from "./post.login";
import { getMe } from "./get.me";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(postRegister)
  .use(postLogin)
  .use(getMe);
