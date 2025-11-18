import amqp, { Connection, Channel } from "amqplib";

const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://taskmaster:taskmaster@localhost:5672";

let connection: Connection | null = null;
let channel: Channel | null = null;

export enum QueueType {
  EMAIL = "email_queue",
  NOTIFICATION = "notification_queue",
}

export interface EmailJob {
  type: "invitation";
  to: string;
  subject: string;
  body: string;
  invitationToken?: string;
  projectName?: string;
}

export interface NotificationJob {
  type: "task_assigned" | "task_comment";
  userId: string;
  message: string;
  taskId?: string;
  projectId?: string;
  metadata?: Record<string, unknown>;
}

export async function connectQueue(): Promise<void> {
  if (connection) {
    return;
  }

  try {
    connection = await amqp.connect(RABBITMQ_URL);

    if (!connection) {
      throw new Error("RabbitMQ connection not available");
    }

    channel = await connection.createChannel();

    if (!channel) {
      throw new Error("RabbitMQ channel not available");
    }

    await channel.assertQueue(QueueType.EMAIL, { durable: true });
    await channel.assertQueue(QueueType.NOTIFICATION, { durable: true });

    console.log("✅ Connected to RabbitMQ");
  } catch (error) {
    console.error("❌ Failed to connect to RabbitMQ:", error);
    throw error;
  }
}

export async function publishEmail(job: EmailJob): Promise<void> {
  if (!channel) {
    await connectQueue();
  }

  if (!channel) {
    throw new Error("RabbitMQ channel not available");
  }

  await channel.sendToQueue(QueueType.EMAIL, Buffer.from(JSON.stringify(job)), {
    persistent: true,
  });

  console.log(`📧 Email job published: ${job.type} to ${job.to}`);
}

export async function publishNotification(job: NotificationJob): Promise<void> {
  if (!channel) {
    await connectQueue();
  }

  if (!channel) {
    throw new Error("RabbitMQ channel not available");
  }

  await channel.sendToQueue(
    QueueType.NOTIFICATION,
    Buffer.from(JSON.stringify(job)),
    { persistent: true }
  );

  console.log(
    `🔔 Notification job published: ${job.type} for user ${job.userId}`
  );
}

export async function consumeEmail(
  handler: (job: EmailJob) => Promise<void>
): Promise<void> {
  if (!channel) {
    await connectQueue();
  }

  if (!channel) {
    throw new Error("RabbitMQ channel not available");
  }

  await channel.prefetch(1);

  await channel.consume(QueueType.EMAIL, async (msg) => {
    if (!msg) {
      return;
    }

    try {
      const job: EmailJob = JSON.parse(msg.content.toString());
      await handler(job);
      channel?.ack(msg);
      console.log(`✅ Email job processed: ${job.type} to ${job.to}`);
    } catch (error) {
      console.error("❌ Error processing email job:", error);
      channel?.nack(msg, false, true);
    }
  });

  console.log(`👂 Listening for email jobs on queue: ${QueueType.EMAIL}`);
}

export async function consumeNotification(
  handler: (job: NotificationJob) => Promise<void>
): Promise<void> {
  if (!channel) {
    await connectQueue();
  }

  if (!channel) {
    throw new Error("RabbitMQ channel not available");
  }

  await channel.prefetch(1);

  await channel.consume(QueueType.NOTIFICATION, async (msg) => {
    if (!msg) {
      return;
    }

    try {
      const job: NotificationJob = JSON.parse(msg.content.toString());
      await handler(job);
      channel?.ack(msg);
      console.log(
        `✅ Notification job processed: ${job.type} for user ${job.userId}`
      );
    } catch (error) {
      console.error("❌ Error processing notification job:", error);
      channel?.nack(msg, false, true);
    }
  });

  console.log(
    `👂 Listening for notification jobs on queue: ${QueueType.NOTIFICATION}`
  );
}

export async function closeQueue(): Promise<void> {
  if (channel) {
    await channel.close();
    channel = null;
  }
  if (connection) {
    await connection.close();
    connection = null;
  }
  console.log("🔌 RabbitMQ connection closed");
}
