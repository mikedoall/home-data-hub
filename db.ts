import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL is not set. Database operations will be unavailable.");
}

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema });
    console.log("Database connection initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database connection:", error);
  }
}

// Export a function that checks if the database is available
export function isDatabaseAvailable(): boolean {
  return !!db;
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  if (!pool) {
    console.error("Database pool not initialized");
    return false;
  }
  
  try {
    const client = await pool.connect();
    client.release();
    console.log("Database connection test successful");
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
}

// Create a mock db for when database is not available
const mockDb = createMockDb();

// Safely export the db object, falling back to a mock if not available
export const realDb = db;
export { pool };
// Use a different name for the exported object to avoid "Symbol already declared" error
export const dbClient = db || mockDb;

// Create a mock DB that logs operations but doesn't perform them
// This is a fallback for when the database is not available
function createMockDb() {
  return {
    select: () => {
      console.warn("Database not available, select operation skipped");
      return { from: () => ({ where: () => [] }) };
    },
    insert: () => {
      console.warn("Database not available, insert operation skipped");
      return { values: () => ({ returning: () => [] }) };
    },
    update: () => {
      console.warn("Database not available, update operation skipped");
      return { set: () => ({ where: () => {} }) };
    },
    delete: () => {
      console.warn("Database not available, delete operation skipped");
      return { where: () => {} };
    }
  };
}