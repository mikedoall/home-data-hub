import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware to check for DATABASE_URL and provide clear error
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api') && !process.env.DATABASE_URL && !req.path.includes('/health')) {
    // Only affect API routes, not static files or health checks
    console.error('DATABASE_URL environment variable is not set');
    return res.status(500).json({ 
      message: "Database configuration error",
      details: "The DATABASE_URL environment variable is not set. Please add this in the Replit Deployments tab under Configuration > Secrets."
    });
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  // Always return OK to allow the app to start even with DB issues
  res.status(200).json({ 
    status: 'ok',
    database: process.env.DATABASE_URL ? 'configured' : 'not configured',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Check for database-related errors
    const isDatabaseError = 
      err.message?.includes('database') || 
      err.message?.includes('DATABASE_URL') ||
      err.message?.includes('sql') ||
      err.message?.includes('pg') ||
      err.message?.includes('connection');
    
    // Log error with stack trace
    console.error(`Server error: ${err.message}`, err.stack);
    
    if (isDatabaseError) {
      return res.status(status).json({ 
        message: "Database error", 
        details: "There was an issue connecting to the database. Please check your DATABASE_URL configuration in Replit Deployments > Configuration > Secrets."
      });
    }
    
    // Return appropriate response
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
