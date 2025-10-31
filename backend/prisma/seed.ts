import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "alice@example.com",
        name: "Alice Johnson",
      },
    }),
    prisma.user.create({
      data: {
        email: "bob@example.com",
        name: "Bob Smith",
      },
    }),
    prisma.user.create({
      data: {
        email: "charlie@example.com",
        name: "Charlie Brown",
      },
    }),
    prisma.user.create({
      data: {
        email: "diana@example.com",
        name: "Diana Prince",
      },
    }),
    prisma.user.create({
      data: {
        email: "eve@example.com",
        name: "Eve Adams",
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create teams
  const teams = await Promise.all([
    prisma.team.create({
      data: {
        name: "Development Team",
        description: "Main development team",
      },
    }),
    prisma.team.create({
      data: {
        name: "Design Team",
        description: "UI/UX design team",
      },
    }),
    prisma.team.create({
      data: {
        name: "Marketing Team",
        description: "Marketing and communication",
      },
    }),
  ]);

  console.log(`✅ Created ${teams.length} teams`);

  // Create user roles (assign users to teams)
  await Promise.all([
    // Development Team
    prisma.userRole.create({
      data: {
        userId: users[0].id,
        teamId: teams[0].id,
        role: Role.TeamLeader,
      },
    }),
    prisma.userRole.create({
      data: {
        userId: users[1].id,
        teamId: teams[0].id,
        role: Role.TeamMember,
      },
    }),
    prisma.userRole.create({
      data: {
        userId: users[2].id,
        teamId: teams[0].id,
        role: Role.TeamMember,
      },
    }),
    // Design Team
    prisma.userRole.create({
      data: {
        userId: users[3].id,
        teamId: teams[1].id,
        role: Role.TeamLeader,
      },
    }),
    prisma.userRole.create({
      data: {
        userId: users[0].id,
        teamId: teams[1].id,
        role: Role.TeamMember,
      },
    }),
    // Marketing Team
    prisma.userRole.create({
      data: {
        userId: users[4].id,
        teamId: teams[2].id,
        role: Role.TeamLeader,
      },
    }),
  ]);

  console.log("✅ Created user roles");

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

  // Create projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: "TaskMaster Web App",
        description: "Main web application project",
        teamId: teams[0].id,
      },
    }),
    prisma.project.create({
      data: {
        name: "Mobile App",
        description: "Mobile application development",
        teamId: teams[0].id,
      },
    }),
    prisma.project.create({
      data: {
        name: "Design System",
        description: "UI design system",
        teamId: teams[1].id,
      },
    }),
    prisma.project.create({
      data: {
        name: "Marketing Campaign",
        description: "Q1 marketing campaign",
        teamId: teams[2].id,
      },
    }),
  ]);

  console.log(`✅ Created ${projects.length} projects`);

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
  console.log(`   - Users: ${users.length}`);
  console.log(`   - Teams: ${teams.length}`);
  console.log(`   - Projects: ${projects.length}`);
  console.log(`   - Task Tags: ${tags.length}`);
  console.log(`   - Tasks: ${tasks.length}`);
  console.log(`   - Total records: ${users.length + teams.length + projects.length + tags.length + tasks.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
