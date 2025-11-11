import { Elysia } from "elysia";
import { prisma } from "./lib/prisma";
import { routes } from "./routes";

const app = new Elysia()
  .onRequest(({ request, set }) => {
    // Set CORS headers for all requests
    set.headers["Access-Control-Allow-Origin"] = "*";
    set.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH";
    set.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
  })
  .onAfterHandle(({ response, set, path, request }) => {
    const method = request.method;
    const status = set.status || 200;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${method} ${path} ${status}`);
  })
  .onError(({ error, path, request, set }) => {
    const method = request.method;
    const status = set.status || 500;
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${timestamp}] ${method} ${path} ${status} - ${errorMessage}`);
  })
  .options("*", ({ set }) => {
    return new Response(null, { status: 204 });
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
