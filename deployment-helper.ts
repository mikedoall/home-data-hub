/**
 * Helper script to ensure deployment works even without proper database configuration
 */

import { IStorage } from './storage';
import { MemStorage } from './storage';
import { testConnection } from './db';
import { databaseStorage } from './database-storage';

/**
 * Returns the appropriate storage implementation based on database availability
 */
export function getStorageImplementation(): IStorage {
  // Check if DATABASE_URL is set
  if (process.env.DATABASE_URL) {
    console.log('Database URL is configured, attempting to use database storage');
    
    // Check database status in the background
    checkDatabaseConfig().then(dbConfig => {
      console.log(`Database check complete: ${dbConfig.isDbConfigured ? 'Available' : 'Unavailable'}`);
      if (dbConfig.isDbConfigured) {
        console.log('Database is confirmed available');
      } else {
        console.log('WARNING: Database URL is configured but connection failed. Some operations may fail.');
      }
    });
    
    // Return database storage
    return databaseStorage;
  } else {
    console.log('DATABASE_URL not configured, using in-memory storage implementation');
    // Return memory storage
    return new MemStorage();
  }
}

/**
 * Checks if database configuration is available and valid
 */
export async function checkDatabaseConfig(): Promise<{ 
  isDbConfigured: boolean;
  message: string;
}> {
  try {
    // Check if DATABASE_URL is set
    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
      return {
        isDbConfigured: false,
        message: 'Database URL not configured'
      };
    }
    
    // Test database connection
    const isConnected = await testConnection();
    
    if (isConnected) {
      return {
        isDbConfigured: true,
        message: 'Database connection successful'
      };
    } else {
      return {
        isDbConfigured: false,
        message: 'Database connection failed'
      };
    }
  } catch (error) {
    console.error('Error checking database config:', error);
    return {
      isDbConfigured: false,
      message: 'Error checking database configuration'
    };
  }
}