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
  color: t.Nullable(t.String()),
});

export const ColumnSchema = t.Object({
  id: t.String(),
  order: t.Number(),
  projectId: t.String(),
  tagId: t.String(),
  tag: t.Nullable(ColumnTagSchema),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export const ColumnsListResponse = t.Object({
  columns: t.Array(ColumnSchema),
});

export const ProjectDetailResponse = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Nullable(t.String()),
  creator: t.Object({
    id: t.String(),
    email: t.String({ format: "email" }),
    name: t.Nullable(t.String()),
  }),
  tasks: t.Array(t.Any()),
  columns: t.Array(ColumnSchema),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export const ProjectCreateResponse = t.Object({
  project: ProjectSchema,
  message: t.String(),
});

export const MemberSchema = t.Object({
  id: t.String(),
  role: t.String(),
  user: t.Object({
    id: t.String(),
    email: t.String({ format: "email" }),
    name: t.Nullable(t.String()),
  }),
  createdAt: t.Date(),
});

export const MembersListResponse = t.Object({
  members: t.Array(MemberSchema),
});

export const ColumnCreateResponse = t.Object({
  column: ColumnSchema,
  message: t.String(),
});

export const ColumnUpdateResponse = t.Object({
  column: ColumnSchema,
  message: t.String(),
});

export const TaskCreateResponse = t.Object({
  task: t.Object({
    id: t.String(),
    number: t.Number(),
    title: t.String(),
    description: t.Nullable(t.String()),
    assignee: t.Nullable(TaskAssigneeSchema),
    tags: t.Array(
      t.Object({
        id: t.String(),
        name: t.String(),
        color: t.String(),
      })
    ),
    columnOrders: t.Array(
      t.Object({
        id: t.String(),
        columnId: t.String(),
        order: t.Number(),
      })
    ),
  }),
  message: t.String(),
});

export const TaskUpdateResponse = t.Object({
  task: t.Any(),
  message: t.String(),
});

export const TaskAssigneeUpdateResponse = t.Object({
  task: t.Object({
    id: t.String(),
    assignee: t.Nullable(TaskAssigneeSchema),
  }),
  message: t.String(),
});

export const TaskTagsUpdateResponse = t.Object({
  task: t.Object({
    id: t.String(),
    tags: t.Array(
      t.Object({
        id: t.String(),
        name: t.String(),
        color: t.String(),
      })
    ),
  }),
  message: t.String(),
});

export const TaskMoveResponse = t.Object({
  message: t.String(),
});

export const TaskReorderResponse = t.Object({
  message: t.String(),
});

export const CommentCreateResponse = t.Object({
  comment: t.Object({
    id: t.String(),
    content: t.String(),
    author: CommentAuthorSchema,
    createdAt: t.Date(),
  }),
  message: t.String(),
});

export const MemberUpdateResponse = t.Object({
  member: MemberSchema,
  message: t.String(),
});

export const SuccessMessageResponse = t.Object({
  message: t.String(),
});

export const InvitationProjectSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Nullable(t.String()),
  creator: t.Optional(
    t.Object({
      id: t.String(),
      email: t.String({ format: "email" }),
      name: t.Nullable(t.String()),
    })
  ),
});

export const InvitationSchema = t.Object({
  id: t.String(),
  token: t.String(),
  project: InvitationProjectSchema,
  role: t.String(),
  expiresAt: t.Date(),
  used: t.Optional(t.Boolean()),
  createdAt: t.Optional(t.Date()),
  isValid: t.Optional(t.Boolean()),
});

export const InvitationDetailResponse = t.Object({
  invitation: InvitationSchema,
});

export const InvitationsListResponse = t.Object({
  invitations: t.Array(InvitationSchema),
});

export const InvitationCreateResponse = t.Object({
  invitation: InvitationSchema,
  invitationLink: t.String(),
  message: t.String(),
});

export const InvitationAcceptResponse = t.Object({
  membership: t.Object({
    id: t.String(),
    role: t.String(),
    user: t.Object({
      id: t.String(),
      email: t.String({ format: "email" }),
      name: t.Nullable(t.String()),
    }),
    project: t.Object({
      id: t.String(),
      name: t.String(),
      description: t.Nullable(t.String()),
    }),
    createdAt: t.Date(),
  }),
  message: t.String(),
});

export const InvitationExpiredResponse = t.Object({
  error: t.String(),
  message: t.String(),
  invitation: t.Optional(
    t.Object({
      id: t.String(),
      project: InvitationProjectSchema,
      role: t.String(),
      expiresAt: t.Date(),
    })
  ),
});

export const HealthResponse = t.Object({
  status: t.String(),
  message: t.String(),
});

export const HealthDbResponse = t.Object({
  status: t.String(),
  database: t.String(),
});

export const RootResponse = t.Object({
  message: t.String(),
});
