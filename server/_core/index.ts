import "dotenv/config";
import express from "express";
import { clerkMiddleware } from "@clerk/express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { createEncryptedDatabaseBackup, hasValidBackupToken } from "./backup";
import { ENV } from "./env";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.use(
    clerkMiddleware({
      publishableKey: ENV.clerkPublishableKey || undefined,
      secretKey: ENV.clerkSecretKey || undefined,
    }),
  );
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.post("/api/ops/backup/export", async (req, res) => {
    const backupToken = process.env.BACKUP_JOB_SECRET;
    const encryptionSecret = process.env.BACKUP_ENCRYPTION_KEY;
    if (!backupToken || !encryptionSecret) {
      res.status(503).json({ error: "Production backup is not configured" });
      return;
    }
    if (!hasValidBackupToken(req.header("x-dreamscoach-backup-token"), backupToken)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    try {
      const archive = await createEncryptedDatabaseBackup(encryptionSecret);
      res.set({
        "Cache-Control": "no-store",
        "Content-Disposition": 'attachment; filename="dreamscoach-production-backup.enc.json"',
        "Content-Type": "application/json; charset=utf-8",
      });
      res.send(archive);
    } catch (error) {
      console.error("[Backup] Encrypted export failed", error);
      res.status(500).json({ error: "Backup export failed" });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
