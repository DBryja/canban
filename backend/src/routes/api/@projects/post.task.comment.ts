import { Elysia, t } from "elysia";
import { prisma } from "../../../lib/prisma";
import { jwtPlugin } from "../../../lib/jwt";
import { requireAuth } from "../../../middleware/auth";
import { checkProjectAccess } from "./helpers";
import { connectQueue, publishNotification } from "../../../lib/queue";
import { CommentCreateResponse, ErrorResponse } from "../schemas";

export const postTaskComment = new Elysia().use(jwtPlugin).post(
  "/:id/tasks/:taskId/comments",
  async ({ params, body, jwt, headers, set }) => {
    const authResult = await requireAuth(jwt, headers, set);
    if ("error" in authResult) {
      return authResult;
    }
    const { userId } = authResult;
    const { id: projectId, taskId } = params;

    const access = await checkProjectAccess(userId, projectId);
    if (!access.hasAccess) {
      set.status = 403;
      return access.error;
    }

    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        set.status = 404;
        return {
          error: "Not Found",
          message: "Project not found",
        };
      }

      const task = await prisma.task.findUnique({
        where: { id: taskId },
      });

      if (!task || task.projectId !== projectId) {
        set.status = 404;
        return {
          error: "Not Found",
          message: "Task not found",
        };
      }

      const comment = await prisma.comment.create({
        data: {
          content: body.content,
          taskId: taskId,
          authorId: userId,
        },
        include: {
          author: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
              assigneeId: true,
              project: {
                select: {
                  id: true,
                  name: true,
                  members: {
                    select: {
                      userId: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Asynchroniczne powiadomienia o nowym komentarzu
      // Powiadomiamy przypisanego użytkownika (jeśli istnieje) oraz innych członków projektu
      try {
        await connectQueue();

        const notifiedUserIds = new Set<string>();

        // Powiadomienie dla przypisanego użytkownika (jeśli nie jest autorem komentarza)
        if (comment.task.assigneeId && comment.task.assigneeId !== userId) {
          notifiedUserIds.add(comment.task.assigneeId);
          await publishNotification({
            type: "task_comment",
            userId: comment.task.assigneeId,
            message: `${comment.author.name || comment.author.email} dodał komentarz do zadania "${comment.task.title}"`,
            taskId: taskId,
            projectId: projectId,
            metadata: {
              taskTitle: comment.task.title,
              projectName: comment.task.project.name,
              commentAuthor: comment.author.name || comment.author.email,
              commentPreview: comment.content.substring(0, 100),
            },
          });
        }

        // Powiadomienia dla innych członków projektu (oprócz autora i przypisanego)
        for (const member of comment.task.project.members) {
          if (
            member.userId !== userId &&
            member.userId !== comment.task.assigneeId &&
            !notifiedUserIds.has(member.userId)
          ) {
            notifiedUserIds.add(member.userId);
            await publishNotification({
              type: "task_comment",
              userId: member.userId,
              message: `${comment.author.name || comment.author.email} dodał komentarz do zadania "${comment.task.title}" w projekcie "${comment.task.project.name}"`,
              taskId: taskId,
              projectId: projectId,
              metadata: {
                taskTitle: comment.task.title,
                projectName: comment.task.project.name,
                commentAuthor: comment.author.name || comment.author.email,
                commentPreview: comment.content.substring(0, 100),
              },
            });
          }
        }
      } catch (error) {
        console.error("Failed to queue comment notifications:", error);
      }

      return {
        comment: {
          id: comment.id,
          content: comment.content,
          author: comment.author,
          createdAt: comment.createdAt,
        },
        message: "Comment created successfully",
      };
    } catch (err) {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: "Failed to create comment",
      };
    }
  },
  {
    body: t.Object({
      content: t.String({ minLength: 1 }),
    }),
    response: {
      200: CommentCreateResponse,
      401: ErrorResponse,
      403: ErrorResponse,
      404: ErrorResponse,
      500: ErrorResponse,
    },
    detail: {
      tags: ["projects"],
    },
  }
);
