/**
 * Script to download FCC broadband data files
 * 
 * This script downloads the necessary FCC broadband data files
 * from the FCC Broadband Map website and stores them in the
 * data directory for processing.
 */

import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream/promises';
import * as https from 'https';
import { createWriteStream } from 'fs';

// Define file locations
const DATA_DIR = path.join(process.cwd(), 'data');
const PROVIDERS_FILE = path.join(DATA_DIR, 'fcc-providers.csv');
const AVAILABILITY_FILE = path.join(DATA_DIR, 'fcc-availability.csv');

// Define sample data size
const SAMPLE_DATA_SIZE = 100; // Number of lines to include in sample files

/**
 * Create necessary directories if they don't exist
 */
function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    console.log(`Creating data directory: ${DATA_DIR}`);
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Download a file from a URL
 * @param url URL to download
 * @param outputPath Local path to save the file
 * @returns Promise that resolves when download is complete
 */
async function downloadFile(url: string, outputPath: string): Promise<boolean> {
  console.log(`Downloading ${url} to ${outputPath}`);
  
  // Check if file already exists
  if (fs.existsSync(outputPath)) {
    console.log(`File already exists: ${outputPath}`);
    return true;
  }
  
  // Create the file stream
  const fileStream = createWriteStream(outputPath);
  
  try {
    // Download the file
    await new Promise<void>((resolve, reject) => {
      https.get(url, (response) => {
        // Check if the request was successful
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download ${url}: ${response.statusCode} ${response.statusMessage}`));
          return;
        }
        
        // Pipe the response to the file
        response.pipe(fileStream);
        
        // Handle events
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
        
        // Handle errors
        response.on('error', (err) => {
          fs.unlinkSync(outputPath); // Delete the partial file
          reject(err);
        });
        
        fileStream.on('error', (err) => {
          fs.unlinkSync(outputPath); // Delete the partial file
          reject(err);
        });
      }).on('error', (err) => {
        fs.unlinkSync(outputPath); // Delete the partial file
        reject(err);
      });
    });
    
    console.log(`Download completed: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`Error downloading file: ${error}`);
    return false;
  }
}

/**
 * Create small sample data files for development
 * This is much faster than using the full FCC dataset
 */
function createSampleDataFiles() {
  console.log('Creating sample data files...');
  
  // Check if the original files exist
  if (!fs.existsSync(PROVIDERS_FILE) || !fs.existsSync(AVAILABILITY_FILE)) {
    console.log('Original data files not found. Cannot create sample files.');
    return;
  }
  
  // Create sample provider file
  const sampleProvidersFile = path.join(DATA_DIR, 'fcc-providers-sample.csv');
  const providerLines = fs.readFileSync(PROVIDERS_FILE, 'utf8').split('\n');
  const headerLine = providerLines[0];
  const sampleProviderLines = providerLines.slice(1, SAMPLE_DATA_SIZE + 1);
  fs.writeFileSync(sampleProvidersFile, [headerLine, ...sampleProviderLines].join('\n'));
  console.log(`Created sample providers file with ${sampleProviderLines.length} providers.`);
  
  // Create sample availability file
  const sampleAvailabilityFile = path.join(DATA_DIR, 'fcc-availability-sample.csv');
  const availabilityLines = fs.readFileSync(AVAILABILITY_FILE, 'utf8').split('\n');
  const availHeaderLine = availabilityLines[0];
  const sampleAvailabilityLines = availabilityLines.slice(1, SAMPLE_DATA_SIZE + 1);
  fs.writeFileSync(sampleAvailabilityFile, [availHeaderLine, ...sampleAvailabilityLines].join('\n'));
  console.log(`Created sample availability file with ${sampleAvailabilityLines.length} records.`);
}

/**
 * Main function to download FCC data
 */
export async function downloadFccData(createSample = true) {
  try {
    console.log('Starting FCC data download...');
    
    // Ensure directories exist
    ensureDirectories();
    
    // Download provider data
    const providerFileUrl = 'https://broadbandmap.fcc.gov/data/download/v1/nationwide/providers.csv';
    await downloadFile(providerFileUrl, PROVIDERS_FILE);
    
    // Download availability data (sample area for now)
    // In a production environment, you'd download the full dataset or state-specific files
    const availabilityFileUrl = 'https://broadbandmap.fcc.gov/data/download/v1/nationwide/availability/jun2023.csv';
    await downloadFile(availabilityFileUrl, AVAILABILITY_FILE);
    
    // Create sample files for faster development
    if (createSample) {
      createSampleDataFiles();
    }
    
    console.log('FCC data download completed successfully!');
  } catch (error) {
    console.error('Error downloading FCC data:', error);
    throw error;
  }
}

// Run the script directly if called from the command line
if (require.main === module) {
  downloadFccData().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}