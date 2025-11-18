import { connectQueue, consumeEmail, EmailJob } from "../lib/queue";

async function processEmailJob(job: EmailJob): Promise<void> {
  console.log(`📧 Processing email job: ${job.type} to ${job.to}`);

  switch (job.type) {
    case "invitation":
      console.log(`📨 Sending invitation email to ${job.to}`);
      console.log(`   Subject: ${job.subject}`);
      console.log(`   Project: ${job.projectName}`);
      console.log(`   Token: ${job.invitationToken}`);
      console.log(`   Body: ${job.body.substring(0, 100)}...`);

      // W rzeczywistej aplikacji tutaj byłoby wysyłanie emaila przez SMTP/SendGrid/etc.
      // Dla demonstracji tylko logujemy
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log(`✅ Invitation email sent to ${job.to}`);
      break;

    default:
      console.warn(`⚠️ Unknown email job type: ${job.type}`);
  }
}

export async function startEmailWorker(): Promise<void> {
  try {
    await connectQueue();
    await consumeEmail(processEmailJob);
    console.log("🚀 Email worker started");
  } catch (error) {
    console.error("❌ Failed to start email worker:", error);
    process.exit(1);
  }
}

if (import.meta.main) {
  startEmailWorker().catch((error) => {
    console.error("Fatal error in email worker:", error);
    process.exit(1);
  });
}
