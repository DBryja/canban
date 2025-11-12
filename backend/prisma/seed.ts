import { PrismaClient, ProjectRole } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await hashPassword("admin!");
  const admin = await prisma.user.create({
    data: {
      email: "admin@admin.com",
      name: "Admin",
      password: adminPassword,
      isAdmin: true,
    },
  });

  console.log("✅ Created admin user");

  // Create regular users
  const user1Password = await hashPassword("user1!");
  const user2Password = await hashPassword("user2!");
  const guest1Password = await hashPassword("guest1!");

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "user1@user.com",
        name: "User 1",
        password: user1Password,
        isAdmin: false,
      },
    }),
    prisma.user.create({
      data: {
        email: "user2@user2.com",
        name: "User 2",
        password: user2Password,
        isAdmin: false,
      },
    }),
    prisma.user.create({
      data: {
        email: "guest1@guest.com",
        name: "Guest 1",
        password: guest1Password,
        isAdmin: false,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} regular users`);

  // Create status tags (for kanban columns)
  const statusTags = await Promise.all([
    prisma.taskTag.create({
      data: {
        name: "Queue",
        color: "#94a3b8",
      },
    }),
    prisma.taskTag.create({
      data: {
        name: "To Do",
        color: "#3b82f6",
      },
    }),
    prisma.taskTag.create({
      data: {
        name: "Doing",
        color: "#f59e0b",
      },
    }),
    prisma.taskTag.create({
      data: {
        name: "Ready for QA",
        color: "#8b5cf6",
      },
    }),
    prisma.taskTag.create({
      data: {
        name: "Testing",
        color: "#06b6d4",
      },
    }),
    prisma.taskTag.create({
      data: {
        name: "Done",
        color: "#10b981",
      },
    }),
    prisma.taskTag.create({
      data: {
        name: "Closed",
        color: "#64748b",
      },
    }),
  ]);

  // Create filter tags (for filtering, not columns)
  const filterTags = await Promise.all([
    prisma.taskTag.create({
      data: {
        name: "Frontend",
        color: "#3b82f6",
      },
    }),
    prisma.taskTag.create({
      data: {
        name: "Backend",
        color: "#10b981",
      },
    }),
    prisma.taskTag.create({
      data: {
        name: "Design",
        color: "#f59e0b",
      },
    }),
    prisma.taskTag.create({
      data: {
        name: "Bug",
        color: "#ef4444",
      },
    }),
    prisma.taskTag.create({
      data: {
        name: "Feature",
        color: "#8b5cf6",
      },
    }),
    prisma.taskTag.create({
      data: {
        name: "Refactor",
        color: "#06b6d4",
      },
    }),
  ]);

  const allTags = [...statusTags, ...filterTags];

  console.log(
    `✅ Created ${statusTags.length} status tags and ${filterTags.length} filter tags`
  );

  // Create projects (only admins can create projects)
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: "TaskMaster Web App",
        description: "Main web application project",
        creatorId: admin.id,
      },
    }),
    prisma.project.create({
      data: {
        name: "Mobile App",
        description: "Mobile application development",
        creatorId: admin.id,
      },
    }),
  ]);

  console.log(`✅ Created ${projects.length} projects`);

  // Add some project members (users invited to projects)
  await Promise.all([
    // User1 as Maintainer in first project
    prisma.projectMember.create({
      data: {
        userId: users[0].id,
        projectId: projects[0].id,
        role: ProjectRole.Maintainer,
      },
    }),
    // User2 as Guest in first project
    prisma.projectMember.create({
      data: {
        userId: users[1].id,
        projectId: projects[0].id,
        role: ProjectRole.Guest,
      },
    }),
    // Guest1 as Guest in second project
    prisma.projectMember.create({
      data: {
        userId: users[2].id,
        projectId: projects[1].id,
        role: ProjectRole.Guest,
      },
    }),
  ]);

  console.log("✅ Created project memberships");

  // Create tasks (at least 30 records)
  const taskTitles = [
    "Implement user authentication",
    "Design login page",
    "Create database schema",
    "Set up CI/CD pipeline",
    "Add dark mode support",
    "Implement task filtering",
    "Create user dashboard",
    "Design logo",
    "Write API documentation",
    "Fix login bug",
    "Optimize database queries",
    "Add email notifications",
    "Create onboarding flow",
    "Implement search functionality",
    "Design color palette",
    "Add error handling",
    "Create user profile page",
    "Implement file upload",
    "Add drag and drop",
    "Design mobile navigation",
    "Optimize images",
    "Add analytics tracking",
    "Create help center",
    "Implement pagination",
    "Add keyboard shortcuts",
    "Design landing page",
    "Create API documentation",
    "Fix performance issues",
    "Add unit tests",
    "Implement real-time updates",
    "Create admin panel",
    "Design icons set",
    "Add export functionality",
    "Implement caching",
    "Create user tutorials",
  ];

  // Helper function to get appropriate tags for a task based on its title
  function getTagsForTask(
    title: string,
    statusTagsArray: Array<{ id: string; name: string; color: string | null }>,
    filterTagsArray: Array<{ id: string; name: string; color: string | null }>,
    index: number
  ) {
    const titleLower = title.toLowerCase();

    // Find filter tags by name
    const frontendTag = filterTagsArray.find((t) => t.name === "Frontend");
    const backendTag = filterTagsArray.find((t) => t.name === "Backend");
    const designTag = filterTagsArray.find((t) => t.name === "Design");
    const bugTag = filterTagsArray.find((t) => t.name === "Bug");
    const featureTag = filterTagsArray.find((t) => t.name === "Feature");
    const refactorTag = filterTagsArray.find((t) => t.name === "Refactor");

    const selectedFilterTags: Array<{
      id: string;
      name: string;
      color: string | null;
    }> = [];

    // Assign status tag as mainTag (for kanban columns)
    // Distribute tasks across different statuses
    const statusIndex = index % statusTagsArray.length;
    const mainTag = statusTagsArray[statusIndex];

    // Frontend-related tasks
    if (
      titleLower.includes("design") ||
      titleLower.includes("page") ||
      titleLower.includes("dashboard") ||
      titleLower.includes("profile") ||
      titleLower.includes("landing") ||
      titleLower.includes("navigation") ||
      titleLower.includes("logo") ||
      titleLower.includes("color") ||
      titleLower.includes("icons") ||
      titleLower.includes("dark mode") ||
      titleLower.includes("drag and drop") ||
      titleLower.includes("keyboard shortcuts")
    ) {
      if (designTag && !selectedFilterTags.includes(designTag)) {
        selectedFilterTags.push(designTag);
      }
      if (frontendTag && !selectedFilterTags.includes(frontendTag)) {
        selectedFilterTags.push(frontendTag);
      }
    }

    // Backend-related tasks
    if (
      titleLower.includes("database") ||
      titleLower.includes("api") ||
      titleLower.includes("authentication") ||
      titleLower.includes("queries") ||
      titleLower.includes("caching") ||
      titleLower.includes("email") ||
      titleLower.includes("real-time")
    ) {
      if (backendTag && !selectedFilterTags.includes(backendTag)) {
        selectedFilterTags.push(backendTag);
      }
    }

    // Bug-related tasks
    if (titleLower.includes("fix") || titleLower.includes("bug")) {
      if (bugTag && !selectedFilterTags.includes(bugTag)) {
        selectedFilterTags.push(bugTag);
      }
    }

    // Feature-related tasks
    if (
      titleLower.includes("add") ||
      titleLower.includes("implement") ||
      titleLower.includes("create") ||
      titleLower.includes("onboarding") ||
      titleLower.includes("search") ||
      titleLower.includes("upload") ||
      titleLower.includes("analytics") ||
      titleLower.includes("pagination") ||
      titleLower.includes("export") ||
      titleLower.includes("notifications")
    ) {
      if (featureTag && !selectedFilterTags.includes(featureTag)) {
        selectedFilterTags.push(featureTag);
      }
    }

    // Refactor-related tasks
    if (
      titleLower.includes("optimize") ||
      titleLower.includes("refactor") ||
      titleLower.includes("performance")
    ) {
      if (refactorTag && !selectedFilterTags.includes(refactorTag)) {
        selectedFilterTags.push(refactorTag);
      }
    }

    // CI/CD and testing
    if (titleLower.includes("ci/cd") || titleLower.includes("pipeline")) {
      if (backendTag && !selectedFilterTags.includes(backendTag)) {
        selectedFilterTags.push(backendTag);
      }
    }

    if (titleLower.includes("test") || titleLower.includes("unit")) {
      if (backendTag && !selectedFilterTags.includes(backendTag)) {
        selectedFilterTags.push(backendTag);
      }
    }

    // Documentation
    if (titleLower.includes("documentation") || titleLower.includes("write")) {
      if (featureTag && !selectedFilterTags.includes(featureTag)) {
        selectedFilterTags.push(featureTag);
      }
    }

    // Help center and tutorials
    if (titleLower.includes("help") || titleLower.includes("tutorial")) {
      if (designTag && !selectedFilterTags.includes(designTag)) {
        selectedFilterTags.push(designTag);
      }
      if (frontendTag && !selectedFilterTags.includes(frontendTag)) {
        selectedFilterTags.push(frontendTag);
      }
    }

    // Ensure at least one filter tag
    if (selectedFilterTags.length === 0) {
      selectedFilterTags.push(featureTag || filterTagsArray[0]);
    }

    // Combine status tag (mainTag) with filter tags
    const allSelectedTags = [mainTag, ...selectedFilterTags];

    return { selectedTags: allSelectedTags, mainTag };
  }

  // Group tasks by project and create them with sequential numbering
  const tasksByProject = new Map<string, typeof taskTitles>();
  taskTitles.forEach((title, index) => {
    const project = projects[index % projects.length];
    if (!tasksByProject.has(project.id)) {
      tasksByProject.set(project.id, []);
    }
    tasksByProject.get(project.id)!.push(title);
  });

  const tasks = [];
  let globalTaskIndex = 0;
  for (const [projectId, projectTasks] of tasksByProject.entries()) {
    for (let i = 0; i < projectTasks.length; i++) {
      const title = projectTasks[i];
      const globalIndex = taskTitles.indexOf(title);
      const creator = users[globalIndex % users.length];
      const { selectedTags, mainTag } = getTagsForTask(
        title,
        statusTags,
        filterTags,
        globalTaskIndex
      );
      globalTaskIndex++;

      const task = await prisma.task.create({
        data: {
          title,
          description: `Description for ${title.toLowerCase()}`,
          projectId,
          creatorId: creator.id,
          mainTagId: mainTag.id,
          number: i + 1, // Sequential numbering starting from 1
          date: new Date(2024, 0, globalIndex + 1),
          tags: {
            connect: selectedTags.map((tag) => ({ id: tag.id })),
          },
        },
      });
      tasks.push(task);
    }
  }

  console.log(`✅ Created ${tasks.length} tasks`);

  console.log("\n✨ Seeding completed successfully!");
  console.log(`\n📊 Summary:`);
  console.log(`   - Admin: 1`);
  console.log(`   - Users: ${users.length}`);
  console.log(`   - Projects: ${projects.length}`);
  console.log(`   - Status Tags: ${statusTags.length}`);
  console.log(`   - Filter Tags: ${filterTags.length}`);
  console.log(`   - Tasks: ${tasks.length}`);
  console.log(`\n🔑 Login credentials:`);
  console.log(`   - Admin: admin@admin.com / admin!`);
  console.log(`   - User 1: user1@user.com / user1!`);
  console.log(`   - User 2: user2@user2.com / user2!`);
  console.log(`   - Guest 1: guest1@guest.com / guest1!`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
