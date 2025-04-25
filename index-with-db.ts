/**
 * Server startup with database support
 * 
 * This version attempts to connect to the database and migrate the schema
 * before starting the server.
 */

import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./vite";
import dotenv from "dotenv";
import { testConnection } from "./db";

// Initialize environment variables from .env file
dotenv.config();

async function main() {
  // Create the Express application
  const app = express();
  
  // Middleware to log all requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    log(`${req.method} ${req.url}`);
    next();
  });
  
  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        url: process.env.DATABASE_URL ? 'Set' : 'Not set',
      }
    });
  });
  
  try {
    // Try to connect to the database
    log('Testing database connection...');
    const isConnected = await testConnection();
    
    if (isConnected) {
      log('✓ Database connection successful');
    } else {
      log('⚠️ Database connection failed - will use in-memory storage');
    }
    
    // Serve static files for deployment mode
    serveStatic(app);
    
    // Register API routes
    const server = await registerRoutes(app);
    
    // Start the server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, '0.0.0.0', () => {
      log(`Server listening on port ${PORT}`);
      log(`API Health Check: http://localhost:${PORT}/api/health`);
      
      if (isConnected) {
        log('Mode: Database-backed (PostgreSQL)');
      } else {
        log('Mode: Static deployment (no database required)');
      }
      
      log('====================================');
      log('  HomeDataHub Server Up and Running');
      log('====================================');
    });
    
    // Set up error handling
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message || 'An unexpected error occurred'
      });
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});