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

  // Create task tags
  const tags = await Promise.all([
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

  console.log(`✅ Created ${tags.length} task tags`);

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

  const tasks = await Promise.all(
    taskTitles.map((title, index) => {
      const project = projects[index % projects.length];
      const creator = users[index % users.length];
      const mainTag = tags[index % tags.length];
      const taskTags = [
        tags[index % tags.length],
        tags[(index + 1) % tags.length],
        tags[(index + 2) % tags.length],
      ].filter((tag, i, arr) => arr.indexOf(tag) === i); // Remove duplicates

      return prisma.task.create({
        data: {
          title,
          description: `Description for ${title.toLowerCase()}`,
          projectId: project.id,
          creatorId: creator.id,
          mainTagId: mainTag.id,
          date: new Date(2024, 0, index + 1), // Different dates
          tags: {
            connect: taskTags.map((tag) => ({ id: tag.id })),
          },
        },
      });
    })
  );

  console.log(`✅ Created ${tasks.length} tasks`);

  console.log("\n✨ Seeding completed successfully!");
  console.log(`\n📊 Summary:`);
  console.log(`   - Admin: 1`);
  console.log(`   - Users: ${users.length}`);
  console.log(`   - Projects: ${projects.length}`);
  console.log(`   - Task Tags: ${tags.length}`);
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
