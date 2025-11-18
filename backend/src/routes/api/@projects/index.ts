import { Elysia } from "elysia";
import { postCreate } from "./post.create";
import { getList } from "./get.list";
import { getById } from "./get.byId";
import { getMembers } from "./get.members";
import { patchMember } from "./patch.member";
import { deleteMember } from "./delete.member";
import { getColumns } from "./get.columns";
import { postColumn } from "./post.column";
import { patchColumn } from "./patch.column";
import { deleteColumn } from "./delete.column";
import { patchTasksReorder } from "./patch.tasks.reorder";
import { patchTasksMove } from "./patch.tasks.move";
import { postTask } from "./post.task";
import { getTask } from "./get.task";
import { patchTaskDescription } from "./patch.task.description";
import { patchTaskAssignee } from "./patch.task.assignee";
import { patchTaskTags } from "./patch.task.tags";
import { postTaskComment } from "./post.task.comment";

export const projectRoutes = new Elysia({ prefix: "/projects" })
  .use(postCreate)
  .use(getList)
  .use(getMembers)
  .use(patchMember)
  .use(deleteMember)
  .use(getColumns)
  .use(postColumn)
  .use(patchColumn)
  .use(deleteColumn)
  .use(patchTasksReorder)
  .use(patchTasksMove)
  .use(getById)
  .use(postTask)
  .use(getTask)
  .use(patchTaskDescription)
  .use(patchTaskAssignee)
  .use(patchTaskTags)
  .use(postTaskComment);
