// Database setup script
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "../shared/schema";
import { DatabaseStorage } from "../server/database-storage";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";
import ws from 'ws';
import { sql } from "drizzle-orm";

// Configure neon to use the ws module
neonConfig.webSocketConstructor = ws;

const execPromise = promisify(exec);

async function runMigrations() {
  console.log("Running migrations first...");
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  try {
    const migrateScript = path.join(__dirname, "db-migrate.ts");
    await execPromise(`npx tsx ${migrateScript}`);
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Error running migrations:", error);
    throw error;
  }
}

async function main() {
  console.log("Setting up database...");
  
  // First run migrations to ensure tables exist
  await runMigrations();
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  
  // Check if there's already data in the properties table
  const existingProperties = await db.select({ count: sql`COUNT(*)` }).from(schema.properties);
  const count = parseInt(existingProperties[0].count.toString());
  
  if (count > 0) {
    console.log(`Database already has ${count} properties, skipping sample data initialization.`);
  } else {
    console.log("Initializing database with sample data...");
    const storage = new DatabaseStorage();
    await storage.initializeSampleData();
    console.log("Sample data initialized successfully.");
  }
  
  // Add geocoding coordinates to properties that don't have them
  console.log("Updating geolocation data for properties...");
  const properties = await db.select().from(schema.properties);
  
  for (const property of properties) {
    if (!property.latitude || !property.longitude) {
      // This is where we would normally call a geocoding service
      // For sample data, we'll just add some fake coordinates
      const lat = 32.7767 + (Math.random() * 0.1);
      const lng = -96.7970 + (Math.random() * 0.1);
      
      await db.update(schema.properties)
        .set({ latitude: lat, longitude: lng })
        .where(sql`id = ${property.id}`);
      
      console.log(`Updated geolocation for ${property.address}: [${lat}, ${lng}]`);
    }
  }
  
  console.log("Database setup completed successfully");
  
  // Close the connection
  await pool.end();
}

main().catch((error) => {
  console.error("Error setting up database:", error);
  process.exit(1);
});