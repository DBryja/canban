import { t } from "elysia";

export const ErrorResponse = t.Object({
  error: t.String(),
  message: t.String(),
});

export const UserSchema = t.Object({
  id: t.String(),
  email: t.String({ format: "email" }),
  name: t.Nullable(t.String()),
  createdAt: t.Date(),
});

export const AuthSuccessResponse = t.Object({
  user: UserSchema,
  token: t.String(),
  message: t.String(),
});

export const ProjectSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Nullable(t.String()),
  creatorId: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export const ProjectsListResponse = t.Object({
  projects: t.Array(ProjectSchema),
});

export const UserWithProjectsSchema = t.Object({
  id: t.String(),
  email: t.String({ format: "email" }),
  name: t.Nullable(t.String()),
  createdAt: t.Date(),
  projectMembers: t.Array(
    t.Object({
      id: t.String(),
      role: t.String(),
      project: t.Object({
        id: t.String(),
        name: t.String(),
        description: t.Nullable(t.String()),
      }),
    })
  ),
});

export const UserResponse = t.Object({
  user: UserWithProjectsSchema,
});

export const CommentAuthorSchema = t.Object({
  id: t.String(),
  email: t.String({ format: "email" }),
  name: t.Nullable(t.String()),
});

export const CommentSchema = t.Object({
  id: t.String(),
  content: t.String(),
  author: CommentAuthorSchema,
  createdAt: t.Date(),
});

export const TaskAssigneeSchema = t.Object({
  id: t.String(),
  email: t.String({ format: "email" }),
  name: t.Nullable(t.String()),
});

export const TaskSchema = t.Object({
  id: t.String(),
  title: t.String(),
  description: t.Nullable(t.String()),
  number: t.Number(),
  assignee: t.Nullable(TaskAssigneeSchema),
  comments: t.Array(CommentSchema),
});

export const TaskResponse = t.Object({
  task: TaskSchema,
});

export const TagSchema = t.Object({
  id: t.String(),
  name: t.String(),
  color: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export const TagsListResponse = t.Object({
  tags: t.Array(TagSchema),
});

export const ColumnTagSchema = t.Object({
  id: t.String(),
  name: t.String(),
  color: t.String(),
});

export const ColumnSchema = t.Object({
  id: t.String(),
  name: t.String(),
  order: t.Number(),
  projectId: t.String(),
  tag: t.Nullable(ColumnTagSchema),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export const ColumnsListResponse = t.Object({
  columns: t.Array(ColumnSchema),
});
