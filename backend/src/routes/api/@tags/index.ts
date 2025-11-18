import { Elysia } from "elysia";
import { getList } from "./get.list";

export const tagRoutes = new Elysia({ prefix: "/tags" }).use(getList);
