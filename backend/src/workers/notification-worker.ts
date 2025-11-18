import {
  connectQueue,
  consumeNotification,
  NotificationJob,
} from "../lib/queue";

async function processNotificationJob(job: NotificationJob): Promise<void> {
  console.log(
    `🔔 Processing notification job: ${job.type} for user ${job.userId}`
  );

  switch (job.type) {
    case "task_assigned":
      console.log(`📋 Task assigned notification for user ${job.userId}`);
      console.log(`   Message: ${job.message}`);
      console.log(`   Task ID: ${job.taskId}`);
      console.log(`   Project ID: ${job.projectId}`);

      // W rzeczywistej aplikacji tutaj byłoby zapisanie powiadomienia do bazy danych
      // lub wysłanie przez WebSocket/SSE do frontendu
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log(
        `✅ Task assignment notification processed for user ${job.userId}`
      );
      break;

    case "task_comment":
      console.log(`💬 Task comment notification for user ${job.userId}`);
      console.log(`   Message: ${job.message}`);
      console.log(`   Task ID: ${job.taskId}`);
      console.log(`   Project ID: ${job.projectId}`);

      // W rzeczywistej aplikacji tutaj byłoby zapisanie powiadomienia do bazy danych
      // lub wysłanie przez WebSocket/SSE do frontendu
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log(
        `✅ Task comment notification processed for user ${job.userId}`
      );
      break;

    default:
      console.warn(`⚠️ Unknown notification job type: ${job.type}`);
  }
}

export async function startNotificationWorker(): Promise<void> {
  try {
    await connectQueue();
    await consumeNotification(processNotificationJob);
    console.log("🚀 Notification worker started");
  } catch (error) {
    console.error("❌ Failed to start notification worker:", error);
    process.exit(1);
  }
}

if (import.meta.main) {
  startNotificationWorker().catch((error) => {
    console.error("Fatal error in notification worker:", error);
    process.exit(1);
  });
}
