import { Elysia } from "elysia";
import { prisma } from "./lib/prisma";
import { routes } from "./routes";

const app = new Elysia()
  .onAfterHandle(({ response, set }) => {
    set.headers["Access-Control-Allow-Origin"] = "*";
    set.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH";
    set.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
  })
  .onRequest(({ set }) => {
    set.headers["Access-Control-Allow-Origin"] = "*";
  })
  .options("*", () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  });

// Health check endpoints
app.get("/health", () => {
  return { status: "ok", message: "TaskMaster API is running" };
});

app.get("/health/db", async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ok", database: "connected" };
  } catch (error) {
    return { status: "error", database: "disconnected" };
  }
});

// API routes
app.use(routes);

// Root endpoint
app.get("/", () => {
  return { message: "Welcome to TaskMaster API" };
});

const port = Number(process.env.PORT) || 3001;

app.listen(port, () => {
  console.log(`🚀 TaskMaster API is running on http://localhost:${port}`);
});
