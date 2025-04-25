
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "../shared/schema";
import { sql } from "drizzle-orm";
import ws from 'ws';

// Configure neon to use the ws module
neonConfig.webSocketConstructor = ws;

async function main() {
  console.log("Running database migrations...");
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'PGDATABASE',
    'PGHOST',
    'PGPORT',
    'PGUSER',
    'PGPASSWORD'
  ];

  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.warn(`Missing database environment variables: ${missingVars.join(', ')}`);
    console.warn('Skipping database migrations - please configure database environment variables in deployment settings');
    return;
  }

  try {
    console.log("Testing database connection...");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query('SELECT NOW()');
    console.log("Database connection successful");

    const db = drizzle(pool, { schema });
  
    console.log("Creating tables if they don't exist...");
  
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE
      );
    `);
  
    // Create properties table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state VARCHAR(2) NOT NULL,
        zip VARCHAR(10) NOT NULL,
        property_type TEXT,
        sqft INTEGER,
        beds INTEGER,
        baths DECIMAL(3, 1),
        price INTEGER,
        latitude DECIMAL(9, 6),
        longitude DECIMAL(9, 6),
        last_updated TIMESTAMP DEFAULT NOW()
      );
    `);
  
    // Create internet_providers table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS internet_providers (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        technology TEXT NOT NULL,
        max_download INTEGER NOT NULL,
        max_upload INTEGER NOT NULL,
        starting_price DECIMAL(6, 2),
        is_available BOOLEAN DEFAULT TRUE
      );
    `);
  
    // Create schools table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS schools (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        address TEXT,
        district TEXT,
        rating INTEGER,
        student_teacher_ratio TEXT
      );
    `);
  
    // Create utilities table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS utilities (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        estimated_cost_min INTEGER,
        estimated_cost_max INTEGER,
        additional_info TEXT
      );
    `);
  
    console.log("Migration completed successfully");
    await pool.end();

  } catch (error) {
    console.error("Database error:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Error running migrations:", error);
  process.exit(1);
});
