import { Elysia, t } from "elysia";
import { prisma } from "../../lib/prisma";
import { jwtPlugin } from "../../lib/jwt";
import { requireAuth } from "../../middleware/auth";
import { ProjectRole } from "@prisma/client";

export const projectRoutes = new Elysia({ prefix: "/projects" })
  .use(jwtPlugin)
  .post(
    "/",
    async ({ body, jwt, headers, set }) => {
      const authResult = await requireAuth(jwt, headers, set);
      if ("error" in authResult) {
        return authResult;
      }
      const { userId } = authResult;

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      });

      if (!user || !user.isAdmin) {
        set.status = 403;
        return {
          error: "Forbidden",
          message: "Only admins can create projects",
        };
      }

      const { name, description } = body;

      try {
        const project = await prisma.project.create({
          data: {
            name,
            description: description || null,
            creatorId: userId,
          },
          select: {
            id: true,
            name: true,
            description: true,
            creatorId: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        return {
          project,
          message: "Project created successfully",
        };
      } catch (err) {
        set.status = 500;
        return {
          error: "Internal Server Error",
          message: "Failed to create project",
        };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
      }),
    }
  )
  .get("/", async ({ jwt, headers, set }) => {
    const authResult = await requireAuth(jwt, headers, set);
    if ("error" in authResult) {
      return authResult;
    }
    const { userId } = authResult;

    try {
      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      });

      let projects;

      if (user?.isAdmin) {
        // Admins can see all projects
        projects = await prisma.project.findMany({
          select: {
            id: true,
            name: true,
            description: true,
            creatorId: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });
      } else {
        // Regular users can only see projects they are members of
        const projectMemberships = await prisma.projectMember.findMany({
          where: { userId },
          select: { projectId: true },
        });
        const projectIds = projectMemberships.map((pm) => pm.projectId);

        projects = await prisma.project.findMany({
          where: {
            id: {
              in: projectIds,
            },
          },
          select: {
            id: true,
            name: true,
            description: true,
            creatorId: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });
      }

      return { projects };
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to fetch projects",
      };
    }
  })
  // Get project members (only admins) - must be before /:id route
  .get("/:id/members", async ({ params, jwt, headers, set }) => {
    const authResult = await requireAuth(jwt, headers, set);
    if ("error" in authResult) {
      return authResult;
    }
    const { userId } = authResult;
    const { id } = params;

    try {
      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      });

      if (!user || !user.isAdmin) {
        set.status = 403;
        return {
          error: "Forbidden",
          message: "Only admins can view project members",
        };
      }

      // Verify project exists
      const project = await prisma.project.findUnique({
        where: { id },
      });

      if (!project) {
        set.status = 404;
        return {
          error: "Not Found",
          message: "Project not found",
        };
      }

      // Get all project members
      const members = await prisma.projectMember.findMany({
        where: { projectId: id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      return {
        members: members.map((member) => ({
          id: member.id,
          role: member.role,
          user: member.user,
          createdAt: member.createdAt,
        })),
      };
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to fetch project members",
      };
    }
  })
  // Update project member role (only admins) - must be before /:id route
  .patch(
    "/:id/members/:memberId",
    async ({ params, body, jwt, headers, set }) => {
      const authResult = await requireAuth(jwt, headers, set);
      if ("error" in authResult) {
        return authResult;
      }
      const { userId } = authResult;
      const { id, memberId } = params;

      try {
        // Check if user is admin
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { isAdmin: true },
        });

        if (!user || !user.isAdmin) {
          set.status = 403;
          return {
            error: "Forbidden",
            message: "Only admins can update project members",
          };
        }

        // Verify project exists
        const project = await prisma.project.findUnique({
          where: { id },
        });

        if (!project) {
          set.status = 404;
          return {
            error: "Not Found",
            message: "Project not found",
          };
        }

        // Verify member exists and belongs to this project
        const member = await prisma.projectMember.findUnique({
          where: { id: memberId },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        });

        if (!member || member.projectId !== id) {
          set.status = 404;
          return {
            error: "Not Found",
            message: "Project member not found",
          };
        }

        // Update member role
        const updatedMember = await prisma.projectMember.update({
          where: { id: memberId },
          data: {
            role: body.role,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        });

        return {
          member: {
            id: updatedMember.id,
            role: updatedMember.role,
            user: updatedMember.user,
            createdAt: updatedMember.createdAt,
          },
          message: "Member role updated successfully",
        };
      } catch (err) {
        set.status = 500;
        return {
          error: "Internal Server Error",
          message: "Failed to update project member",
        };
      }
    },
    {
      body: t.Object({
        role: t.Union([t.Literal("Guest"), t.Literal("Maintainer")]),
      }),
    }
  )
  // Remove project member (only admins) - must be before /:id route
  .delete("/:id/members/:memberId", async ({ params, jwt, headers, set }) => {
    const authResult = await requireAuth(jwt, headers, set);
    if ("error" in authResult) {
      return authResult;
    }
    const { userId } = authResult;
    const { id, memberId } = params;

    try {
      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      });

      if (!user || !user.isAdmin) {
        set.status = 403;
        return {
          error: "Forbidden",
          message: "Only admins can remove project members",
        };
      }

      // Verify project exists
      const project = await prisma.project.findUnique({
        where: { id },
      });

      if (!project) {
        set.status = 404;
        return {
          error: "Not Found",
          message: "Project not found",
        };
      }

      // Verify member exists and belongs to this project
      const member = await prisma.projectMember.findUnique({
        where: { id: memberId },
      });

      if (!member || member.projectId !== id) {
        set.status = 404;
        return {
          error: "Not Found",
          message: "Project member not found",
        };
      }

      // Remove member
      await prisma.projectMember.delete({
        where: { id: memberId },
      });

      return {
        message: "Member removed successfully",
      };
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to remove project member",
      };
    }
  })
  .get("/:id", async ({ params, jwt, headers, set }) => {
    const authResult = await requireAuth(jwt, headers, set);
    if ("error" in authResult) {
      return authResult;
    }
    const { userId } = authResult;
    const { id } = params;

    try {
      // Check if user has access to this project
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      });

      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          tasks: {
            select: {
              id: true,
              title: true,
              description: true,
              projectId: true,
              creatorId: true,
              mainTagId: true,
              tags: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
              mainTag: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
              creator: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!project) {
        set.status = 404;
        return {
          error: "Not Found",
          message: "Project not found",
        };
      }

      // Check access: admin or project member
      if (!user?.isAdmin) {
        const membership = await prisma.projectMember.findUnique({
          where: {
            userId_projectId: {
              userId,
              projectId: id,
            },
          },
        });

        if (!membership) {
          set.status = 403;
          return {
            error: "Forbidden",
            message: "You don't have access to this project",
          };
        }
      }

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        creator: project.creator,
        tasks: project.tasks,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to fetch project",
      };
    }
  });
