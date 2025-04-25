/**
 * Census Geocoding Service
 * 
 * This service provides methods to convert addresses and coordinates to Census Block information
 * using the Census Geocoding API (https://geocoding.geo.census.gov/geocoder/)
 */

import fetch from 'node-fetch';

// Types for Census API responses
interface CensusGeocoderResponse {
  result?: {
    geographies?: {
      "2020 Census Blocks"?: Array<{
        GEOID: string;
        STATE: string;
        COUNTY: string;
        TRACT: string;
        BLOCK: string;
        INTPTLAT: string;
        INTPTLON: string;
        NAME: string;
        [key: string]: any;
      }>;
      [key: string]: any;
    };
    addressMatches?: Array<{
      coordinates: {
        x: string;
        y: string;
        [key: string]: any;
      };
      [key: string]: any;
    }>;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface CensusBlockInfo {
  geoid: string;
  state: string;
  county: string;
  tract: string;
  block: string;
  latitude: number;
  longitude: number;
  name: string;
}

export interface CensusGeocodeResult {
  success: boolean;
  blockInfo?: CensusBlockInfo;
  error?: string;
}

export class CensusGeocodingService {
  private baseUrl = 'https://geocoding.geo.census.gov/geocoder';
  
  /**
   * Convert latitude and longitude to Census Block information
   * 
   * @param latitude Latitude coordinate
   * @param longitude Longitude coordinate
   * @returns Promise with CensusGeocodeResult containing block information or error
   */
  async getBlockInfoFromCoordinates(latitude: number, longitude: number): Promise<CensusGeocodeResult> {
    try {
      // Use the Census Geocoding API to get block information
      const url = `${this.baseUrl}/geographies/coordinates?x=${longitude}&y=${latitude}&benchmark=Public_AR_Current&vintage=Current_Current&format=json&layers=2020%20Census%20Blocks`;
      
      console.log(`[Census Geocoding] Getting block info for lat: ${latitude}, lng: ${longitude}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Census Geocoding] API error (${response.status}): ${errorText}`);
        return {
          success: false,
          error: `Census API returned ${response.status}: ${errorText}`
        };
      }
      
      const data = await response.json() as CensusGeocoderResponse;
      
      // Check if we got block information
      if (!data.result || 
          !data.result.geographies || 
          !data.result.geographies["2020 Census Blocks"] || 
          !data.result.geographies["2020 Census Blocks"].length) {
        console.warn(`[Census Geocoding] No block information found for lat: ${latitude}, lng: ${longitude}`);
        return {
          success: false,
          error: `No Census block found for these coordinates`
        };
      }
      
      // Get the first block (should only be one)
      const block = data.result.geographies["2020 Census Blocks"][0];
      
      // Format the response
      const blockInfo: CensusBlockInfo = {
        geoid: block.GEOID,
        state: block.STATE,
        county: block.COUNTY,
        tract: block.TRACT,
        block: block.BLOCK,
        latitude: parseFloat(block.INTPTLAT),
        longitude: parseFloat(block.INTPTLON),
        name: block.NAME
      };
      
      console.log(`[Census Geocoding] Found block ${blockInfo.geoid}`);
      
      return {
        success: true,
        blockInfo
      };
    } catch (error) {
      console.error(`[Census Geocoding] Error getting block info:`, error);
      return {
        success: false,
        error: String(error)
      };
    }
  }
  
  /**
   * Convert an address to Census Block information
   * 
   * @param address Street address (e.g. "1600 Pennsylvania Ave, Washington DC")
   * @returns Promise with CensusGeocodeResult containing block information or error
   */
  async getBlockInfoFromAddress(address: string): Promise<CensusGeocodeResult> {
    try {
      // First, geocode the address to get coordinates
      const geocodeResult = await this.geocodeAddress(address);
      
      if (!geocodeResult.success || !geocodeResult.coordinates) {
        return {
          success: false,
          error: geocodeResult.error || 'Unable to geocode address'
        };
      }
      
      // Then use coordinates to get block info
      return this.getBlockInfoFromCoordinates(
        geocodeResult.coordinates.latitude,
        geocodeResult.coordinates.longitude
      );
    } catch (error) {
      console.error(`[Census Geocoding] Error geocoding address:`, error);
      return {
        success: false,
        error: String(error)
      };
    }
  }
  
  /**
   * Geocode an address to latitude/longitude using Census Geocoding API
   * 
   * @param address Street address (e.g. "1600 Pennsylvania Ave, Washington DC")
   * @returns Promise with geocoding result
   */
  private async geocodeAddress(address: string): Promise<{
    success: boolean;
    coordinates?: { latitude: number; longitude: number };
    error?: string;
  }> {
    try {
      // Format and encode the address for the URL
      const encodedAddress = encodeURIComponent(address);
      
      // Call the Census Geocoding API
      const url = `${this.baseUrl}/onelineaddress?address=${encodedAddress}&benchmark=Public_AR_Current&format=json`;
      
      console.log(`[Census Geocoding] Geocoding address: ${address}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Census Geocoding] API error (${response.status}): ${errorText}`);
        return {
          success: false,
          error: `Census API returned ${response.status}: ${errorText}`
        };
      }
      
      const data = await response.json() as CensusGeocoderResponse;
      
      // Check if we got results
      if (!data.result || 
          !data.result.addressMatches || 
          !data.result.addressMatches.length) {
        console.warn(`[Census Geocoding] No matches found for address: ${address}`);
        return {
          success: false,
          error: `No matches found for address`
        };
      }
      
      // Get the first match (best match)
      const match = data.result.addressMatches[0];
      
      // Extract coordinates
      const coordinates = {
        latitude: parseFloat(match.coordinates.y),
        longitude: parseFloat(match.coordinates.x)
      };
      
      console.log(`[Census Geocoding] Found coordinates for address: lat: ${coordinates.latitude}, lng: ${coordinates.longitude}`);
      
      return {
        success: true,
        coordinates
      };
    } catch (error) {
      console.error(`[Census Geocoding] Error geocoding address:`, error);
      return {
        success: false,
        error: String(error)
      };
    }
  }
}

// Create a singleton instance
export const censusGeocodingService = new CensusGeocodingService();