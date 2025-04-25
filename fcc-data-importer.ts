/**
 * FCC Data Importer
 * 
 * This script imports FCC broadband data from CSV files into the database.
 * It processes providers and availability data separately.
 */

import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import { createReadStream } from 'fs';
import { finished } from 'stream/promises';
import { dbClient } from '../server/db';
import * as schema from '../shared/schema';
import { eq, and, gt, lt, gte, lte, inArray, sql } from 'drizzle-orm';

// Data file paths
const DATA_DIR = path.join(process.cwd(), 'data');
const PROVIDERS_FILE = path.join(DATA_DIR, 'fcc-providers.csv');
const AVAILABILITY_FILE = path.join(DATA_DIR, 'fcc-availability.csv');

// Define record types
interface ProviderRecord {
  providerName: string;
  providerDbaName?: string;
  frn: string;
  holdingCompanyName?: string;
  holdingCompanyFinal?: string;
  providerType?: string;
  dataAsOf: string;
}

interface AvailabilityRecord {
  frn: string; // to link with provider
  technologyCode: string;
  technologyName: string;
  maxDownload: number;
  maxUpload: number;
  blockId: string;
  stateAbbr: string;
  county: string;
  latitude: number;
  longitude: number;
  dataAsOf: string;
}

/**
 * Process the providers CSV file and import into database
 * Returns a map of FRN to provider ID for use in availability import
 */
async function processProvidersFile(filePath: string): Promise<Map<string, number>> {
  console.log(`Processing providers file: ${filePath}`);
  
  // Map to store FRN to provider ID mapping
  const frnToIdMap = new Map<string, number>();
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`Providers file not found: ${filePath}`);
    return frnToIdMap;
  }
  
  // Create a parser for the CSV
  const results: ProviderRecord[] = [];
  
  // Read and parse the CSV file
  const parser = createReadStream(filePath).pipe(csv({
    columns: true,
    skip_empty_lines: true,
  }));
  
  // Process each row
  parser.on('data', (data) => {
    try {
      // Normalize the data
      const provider: ProviderRecord = {
        providerName: data.providerName,
        providerDbaName: data.providerDbaName || null,
        frn: data.frn,
        holdingCompanyName: data.holdingCompanyName || null,
        holdingCompanyFinal: data.holdingCompanyFinal || null,
        providerType: data.providerType || null,
        dataAsOf: data.dataAsOf || new Date().toISOString()
      };
      
      results.push(provider);
    } catch (error) {
      console.error('Error processing provider row:', error);
    }
  });
  
  // Wait for the parser to finish
  await finished(parser);
  
  console.log(`Processed ${results.length} provider records`);
  
  // Import the records into the database
  if (results.length > 0) {
    // Process in batches to avoid overwhelming the database
    const batchSize = 100;
    let processed = 0;
    
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      
      // Insert providers in batches
      try {
        const insertedProviders = await dbClient.insert(schema.broadbandProviders)
          .values(batch)
          .onConflictDoUpdate({
            target: schema.broadbandProviders.frn,
            set: {
              providerName: schema.broadbandProviders.providerName,
              providerDbaName: schema.broadbandProviders.providerDbaName,
              holdingCompanyName: schema.broadbandProviders.holdingCompanyName,
              holdingCompanyFinal: schema.broadbandProviders.holdingCompanyFinal,
              providerType: schema.broadbandProviders.providerType,
              dataAsOf: schema.broadbandProviders.dataAsOf,
            }
          })
          .returning({ id: schema.broadbandProviders.id, frn: schema.broadbandProviders.frn });
        
        // Add to FRN to ID map
        for (const provider of insertedProviders) {
          frnToIdMap.set(provider.frn, provider.id);
        }
        
        processed += batch.length;
        console.log(`Imported ${processed}/${results.length} providers`);
      } catch (error) {
        console.error('Error inserting provider batch:', error);
      }
    }
  }
  
  return frnToIdMap;
}

/**
 * Process the availability CSV file and import into database
 */
async function processAvailabilityFile(filePath: string, frnToIdMap: Map<string, number>): Promise<void> {
  console.log(`Processing availability file: ${filePath}`);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`Availability file not found: ${filePath}`);
    return;
  }
  
  // Create a parser for the CSV
  const results: AvailabilityRecord[] = [];
  
  // Read and parse the CSV file
  const parser = createReadStream(filePath).pipe(csv({
    columns: true,
    skip_empty_lines: true,
  }));
  
  // Process each row
  parser.on('data', (data) => {
    try {
      // Skip if FRN isn't in our provider map
      if (!frnToIdMap.has(data.frn)) {
        return;
      }
      
      // Normalize the data
      const availability: AvailabilityRecord = {
        frn: data.frn,
        technologyCode: data.techCode,
        technologyName: data.techName || '',
        maxDownload: parseFloat(data.maxAdDown) || 0,
        maxUpload: parseFloat(data.maxAdUp) || 0,
        blockId: data.blockId,
        stateAbbr: data.stateAbbr,
        county: data.county,
        latitude: parseFloat(data.latitude) || 0,
        longitude: parseFloat(data.longitude) || 0,
        dataAsOf: data.dataAsOf || new Date().toISOString()
      };
      
      results.push(availability);
    } catch (error) {
      console.error('Error processing availability row:', error);
    }
  });
  
  // Wait for the parser to finish
  await finished(parser);
  
  console.log(`Processed ${results.length} availability records`);
  
  // Import the records into the database
  if (results.length > 0) {
    // Process in batches to avoid overwhelming the database
    const batchSize = 100;
    let processed = 0;
    
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      
      // Insert availability records in batches
      try {
        await dbClient.insert(schema.broadbandAvailability)
          .values(batch.map(record => ({
            providerId: frnToIdMap.get(record.frn) || 0,
            frn: record.frn,
            technologyCode: record.technologyCode,
            technologyName: record.technologyName,
            maxDownload: record.maxDownload,
            maxUpload: record.maxUpload,
            blockId: record.blockId,
            stateAbbr: record.stateAbbr,
            county: record.county,
            latitude: record.latitude,
            longitude: record.longitude,
            dataAsOf: record.dataAsOf
          })))
          .onConflictDoUpdate({
            target: [
              schema.broadbandAvailability.frn,
              schema.broadbandAvailability.blockId,
              schema.broadbandAvailability.technologyCode
            ],
            set: {
              maxDownload: schema.broadbandAvailability.maxDownload,
              maxUpload: schema.broadbandAvailability.maxUpload,
              dataAsOf: schema.broadbandAvailability.dataAsOf
            }
          });
        
        processed += batch.length;
        console.log(`Imported ${processed}/${results.length} availability records`);
      } catch (error) {
        console.error('Error inserting availability batch:', error);
      }
    }
  }
}

/**
 * Main function to import FCC data
 */
export async function importFccData() {
  try {
    console.log('Starting FCC data import...');
    
    // Process providers first
    const frnToIdMap = await processProvidersFile(PROVIDERS_FILE);
    console.log(`Mapped ${frnToIdMap.size} provider FRNs to IDs`);
    
    // Process availability data, using the FRN map
    await processAvailabilityFile(AVAILABILITY_FILE, frnToIdMap);
    
    console.log('FCC data import completed successfully!');
  } catch (error) {
    console.error('Error importing FCC data:', error);
    throw error;
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  importFccData().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}