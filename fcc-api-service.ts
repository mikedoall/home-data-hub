/**
 * FCC API Service
 * 
 * This service handles fetching broadband data from the FCC API
 * with database caching for performance.
 */
import fetch from 'node-fetch';
import { dbClient, isDatabaseAvailable } from './db';
import { fccCache, insertFccCacheSchema } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Cache expiration time (24 hours in milliseconds)
const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000;

/**
 * Main function to get FCC broadband data for a census block
 * Checks the cache first, then falls back to the FCC API if needed
 * 
 * @param geoid Census block ID (GEOID)
 * @returns Broadband data for the census block
 */
export async function getFccBroadbandData(geoid: string): Promise<any> {
  console.log(`Getting broadband data for Census block ${geoid}`);
  
  try {
    // Check cache first
    const cachedData = await checkCache(geoid);
    
    if (cachedData) {
      console.log(`Using cached FCC data for block ${geoid}`);
      return cachedData;
    }
    
    // If not in cache, fetch from FCC API
    console.log(`Cache miss for block ${geoid}, fetching from FCC API`);
    const freshData = await fetchFromFccApi(geoid);
    
    // Store in cache for future use
    await cacheResults(geoid, freshData);
    
    return freshData;
  } catch (error) {
    console.error(`Error getting FCC data for block ${geoid}:`, error);
    throw error;
  }
}

/**
 * Check if data exists in cache and is still valid
 * 
 * @param geoid Census block ID
 * @returns Cached data if available, null otherwise
 */
async function checkCache(geoid: string): Promise<any | null> {
  // Skip cache check if database is not available
  if (!isDatabaseAvailable()) {
    console.log('Database not available, skipping cache check');
    return null;
  }
  
  try {
    const [cacheEntry] = await dbClient
      .select()
      .from(fccCache)
      .where(eq(fccCache.geoid, geoid));
    
    if (!cacheEntry) {
      return null;
    }
    
    // Check if cache has expired
    if (cacheEntry.expiresAt && new Date(cacheEntry.expiresAt) < new Date()) {
      console.log(`Cache for block ${geoid} has expired`);
      return null;
    }
    
    // Return parsed data
    return JSON.parse(cacheEntry.broadbandData);
  } catch (error) {
    console.error('Error checking cache:', error);
    return null;
  }
}

/**
 * Store broadband data in the cache
 * 
 * @param geoid Census block ID
 * @param data Broadband data to cache
 */
async function cacheResults(geoid: string, data: any): Promise<void> {
  // Skip caching if database is not available
  if (!isDatabaseAvailable()) {
    console.log('Database not available, skipping caching');
    return;
  }
  
  try {
    // Calculate expiration time
    const expiresAt = new Date(Date.now() + CACHE_EXPIRATION_MS);
    
    // Check if entry already exists
    const [existing] = await dbClient
      .select()
      .from(fccCache)
      .where(eq(fccCache.geoid, geoid));
    
    if (existing) {
      // Update existing entry
      await dbClient
        .update(fccCache)
        .set({
          broadbandData: JSON.stringify(data),
          lastFetched: new Date(),
          expiresAt
        })
        .where(eq(fccCache.geoid, geoid));
      
      console.log(`Updated cache entry for block ${geoid}`);
    } else {
      // Insert new entry
      await dbClient
        .insert(fccCache)
        .values({
          geoid,
          broadbandData: JSON.stringify(data),
          expiresAt
        });
      
      console.log(`Created new cache entry for block ${geoid}`);
    }
  } catch (error) {
    console.error('Error caching FCC data:', error);
    // Continue without failing - caching errors shouldn't break the app
  }
}

/**
 * Fetch broadband data directly from the FCC API
 * 
 * @param geoid Census block ID
 * @returns Broadband data from the FCC API
 */
async function fetchFromFccApi(geoid: string): Promise<any> {
  console.log(`Using blockcode query: https://opendata.fcc.gov/resource/jdr4-3q4p.json?blockcode=${geoid}&$limit=50`);
  
  try {
    // Use the FCC Open Data API
    const response = await fetch(
      `https://opendata.fcc.gov/resource/jdr4-3q4p.json?blockcode=${geoid}&$limit=50`
    );
    
    if (!response.ok) {
      throw new Error(`FCC API returned status: ${response.status}`);
    }
    
    const rawData = await response.json();
    
    if (!Array.isArray(rawData) || rawData.length === 0) {
      console.log('Open Data API returned empty results set');
      return { providers: [], message: 'No broadband data available for this location' };
    }
    
    console.log(`Parsed ${rawData.length} records from Open Data API`);
    
    // Process and format the data
    const providers = formatProviderData(rawData);
    
    return {
      providers,
      message: 'Providers available at this location according to FCC data',
      error: false,
      source: 'FCC Broadband Map API',
      blockcode: geoid,
      fromFCC: true
    };
  } catch (error) {
    console.error('Error fetching from FCC API:', error);
    throw error;
  }
}

/**
 * Format raw FCC API data into a consistent format
 * 
 * @param rawData Raw data from the FCC API
 * @returns Formatted provider data
 */
function formatProviderData(rawData: any[]): any[] {
  // Group records by provider
  const providerMap = new Map();
  
  for (const record of rawData) {
    const providerName = record.providername || record.providerName || 'Unknown Provider';
    const frn = record.frn;
    
    if (!providerMap.has(frn)) {
      providerMap.set(frn, {
        name: providerName,
        technologies: [],
        maxDownload: 0,
        maxUpload: 0,
        source: 'FCC Broadband Map'
      });
    }
    
    const provider = providerMap.get(frn);
    
    // Get technology name based on code
    const techCode = record.techcode || record.technologyCode;
    const techName = getTechnologyName(techCode);
    
    // Add technology if not already added
    if (!provider.technologies.includes(techName)) {
      provider.technologies.push(techName);
    }
    
    // Update max speeds if the new speeds are higher
    const download = Number(record.maxaddown || record.maxDownload) || 0;
    const upload = Number(record.maxadup || record.maxUpload) || 0;
    
    if (download > provider.maxDownload) {
      provider.maxDownload = download;
    }
    
    if (upload > provider.maxUpload) {
      provider.maxUpload = upload;
    }
  }
  
  const providers = Array.from(providerMap.values());
  console.log(`Formatted ${providers.length} unique providers from Open Data API`);
  
  return providers;
}

/**
 * Convert FCC technology codes to human-readable names
 * 
 * @param code FCC technology code
 * @returns Human-readable technology name
 */
function getTechnologyName(code: string): string {
  const techMap: Record<string, string> = {
    '10': 'Copper Wireline',
    '11': 'DSL',
    '12': 'DSL - ADSL',
    '13': 'DSL - SDSL',
    '14': 'DSL - HDSL',
    '15': 'DSL - VDSL',
    '16': 'DSL - IDSL',
    '20': 'Optical Carrier/Fiber to the End User',
    '30': 'Cable Modem - DOCSIS 1, 1.1, 2.0',
    '31': 'Cable Modem - DOCSIS 3.0',
    '32': 'Cable Modem - DOCSIS 3.1',
    '40': 'Terrestrial Fixed Wireless',
    '41': 'Terrestrial Fixed Wireless - Unlicensed',
    '42': 'Terrestrial Fixed Wireless - Licensed',
    '43': 'Terrestrial Fixed Wireless - MMDS BRS',
    '50': 'Satellite',
    '60': 'Electric Power Line',
    '70': 'All Other',
    '90': 'Other'
  };
  
  return techMap[code] || `Technology Code ${code}`;
}

// Export the FCC API service as a coherent object with all methods
export const fccApiService = {
  getFccBroadbandData
};