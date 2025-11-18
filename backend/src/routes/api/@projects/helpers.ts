import { prisma } from "../../../lib/prisma";

export async function checkProjectAccess(
  userId: string,
  projectId: string
): Promise<
  | { hasAccess: true; isAdmin: boolean; membership?: { role: string } }
  | { hasAccess: false; error: { error: string; message: string } }
> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  if (user?.isAdmin) {
    return { hasAccess: true, isAdmin: true };
  }

  const membership = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId,
      },
    },
  });

  if (!membership) {
    return {
      hasAccess: false,
      error: {
        error: "Forbidden",
        message: "You don't have access to this project",
      },
    };
  }

  return { hasAccess: true, isAdmin: false, membership };
}

export async function checkMaintainerAccess(
  userId: string,
  projectId: string
): Promise<
  | { hasAccess: true; isAdmin: boolean }
  | { hasAccess: false; error: { error: string; message: string } }
> {
  const access = await checkProjectAccess(userId, projectId);
  if (!access.hasAccess) {
    return access;
  }

  if (access.isAdmin) {
    return { hasAccess: true, isAdmin: true };
  }

  if (access.membership?.role !== "Maintainer") {
    return {
      hasAccess: false,
      error: {
        error: "Forbidden",
        message: "Only admins and maintainers can perform this action",
      },
    };
  }

  return { hasAccess: true, isAdmin: false };
}

export async function checkAdminAccess(
  userId: string
): Promise<
  | { hasAccess: true }
  | { hasAccess: false; error: { error: string; message: string } }
> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  if (!user || !user.isAdmin) {
    return {
      hasAccess: false,
      error: {
        error: "Forbidden",
        message: "Only admins can perform this action",
      },
    };
  }

  return { hasAccess: true };
}
