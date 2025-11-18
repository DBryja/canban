import { startEmailWorker } from "./email-worker";
import { startNotificationWorker } from "./notification-worker";

export async function startAllWorkers(): Promise<void> {
  console.log("🚀 Starting all workers...");

  await Promise.all([startEmailWorker(), startNotificationWorker()]);
}

if (import.meta.main) {
  startAllWorkers().catch((error) => {
    console.error("Fatal error starting workers:", error);
    process.exit(1);
  });
}
