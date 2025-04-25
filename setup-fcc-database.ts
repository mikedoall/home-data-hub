/**
 * Database setup and FCC data import script
 * 
 * This script:
 * 1. Pushes the database schema to the PostgreSQL database
 * 2. Downloads FCC CSV data files
 * 3. Imports the data into the database
 */

import { execSync } from 'child_process';
import { downloadFccData } from './download-fcc-data';
import { importFccData } from './fcc-data-importer';
import { dbClient, pool } from '../server/db';
import { testConnection } from '../server/db';

async function main() {
  try {
    console.log('Starting FCC database setup...');
    
    // Step 1: Test database connection
    console.log('Testing database connection...');
    const connectionSuccessful = await testConnection();
    
    if (!connectionSuccessful) {
      console.error('Could not connect to the database. Please check your configuration.');
      process.exit(1);
    }
    
    console.log('Database connection successful.');
    
    // Step 2: Push schema to database
    console.log('Pushing schema to database...');
    try {
      execSync('npx drizzle-kit push:pg', { stdio: 'inherit' });
      console.log('Schema pushed successfully.');
    } catch (error) {
      console.error('Error pushing schema:', error);
      process.exit(1);
    }
    
    // Step 3: Download FCC data
    console.log('Downloading FCC data...');
    await downloadFccData();
    
    // Step 4: Import FCC data
    console.log('Importing FCC data...');
    await importFccData();
    
    console.log('FCC database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up FCC database:', error);
    process.exit(1);
  } finally {
    // Close database connection
    if (pool) {
      await pool.end();
    }
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export default main;