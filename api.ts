import { apiRequest } from "./queryClient";
import type { 
  Property, 
  InternetProvider, 
  School, 
  Utility,
  InsertProperty,
  InsertInternetProvider,
  InsertSchool,
  InsertUtility
} from "@shared/schema";

// Property API functions
export interface PropertySearchResponse {
  success: boolean;
  query: string;
  results: Property[];
  count: number;
}

export async function searchProperties(query: string): Promise<Property[]> {
  try {
    console.log("API call - searchProperties with query:", query);
    const res = await apiRequest("GET", `/api/properties/search?q=${encodeURIComponent(query)}`, undefined);
    const data: PropertySearchResponse = await res.json();
    console.log("API response - searchProperties:", data);
    
    // Return the results array from the new API response format
    if (data && data.results && Array.isArray(data.results)) {
      return data.results;
    } else if (Array.isArray(data)) {
      // For backwards compatibility with old API format
      return data;
    } else {
      console.warn("Unexpected search response format:", data);
      return [];
    }
  } catch (error) {
    console.error("API error - searchProperties:", error);
    return []; // Return empty array instead of throwing to avoid breaking the UI
  }
}

export async function getPropertyById(id: number): Promise<Property> {
  const res = await apiRequest("GET", `/api/properties/${id}`, undefined);
  return res.json();
}

export async function getPropertyByAddress(address: string): Promise<Property> {
  const res = await apiRequest("GET", `/api/properties/address/${encodeURIComponent(address)}`, undefined);
  return res.json();
}

export async function createProperty(property: InsertProperty): Promise<Property> {
  const res = await apiRequest("POST", "/api/properties", property);
  return res.json();
}

// Internet Provider API functions
export async function getInternetProvidersByPropertyId(propertyId: number): Promise<InternetProvider[]> {
  const res = await apiRequest("GET", `/api/properties/${propertyId}/internet`, undefined);
  return res.json();
}

export async function createInternetProvider(provider: InsertInternetProvider): Promise<InternetProvider> {
  const res = await apiRequest("POST", "/api/internet-providers", provider);
  return res.json();
}

// School API functions
export async function getSchoolsByPropertyId(propertyId: number): Promise<School[]> {
  const res = await apiRequest("GET", `/api/properties/${propertyId}/schools`, undefined);
  return res.json();
}

export async function createSchool(school: InsertSchool): Promise<School> {
  const res = await apiRequest("POST", "/api/schools", school);
  return res.json();
}

// Utility API functions
export async function getUtilitiesByPropertyId(propertyId: number): Promise<Utility[]> {
  const res = await apiRequest("GET", `/api/properties/${propertyId}/utilities`, undefined);
  return res.json();
}

export async function createUtility(utility: InsertUtility): Promise<Utility> {
  const res = await apiRequest("POST", "/api/utilities", utility);
  return res.json();
}

// FCC Broadband Map data
export interface BroadbandProvider {
  name: string;
  technologies: string[];
  maxDownload: number;
  maxUpload: number;
  source: string;
}

export interface BroadbandData {
  providers: BroadbandProvider[];
  message?: string;
  error?: boolean;
}

export async function getBroadbandData(lat: number, lng: number): Promise<BroadbandData> {
  const res = await apiRequest("GET", `/api/broadband-data?lat=${lat}&lng=${lng}`, undefined);
  return res.json();
}

// Get full property data with related information
export interface PropertyFullData {
  property: Property & {
    censusBlock?: {
      geoid: string;
      state: string;
      county: string;
      tract: string;
      block: string;
      latitude: number;
      longitude: number;
      name: string;
    };
    broadbandData?: {
      providers: {
        name: string;
        technologies: string[];
        maxDownload: number;
        maxUpload: number;
        source: string;
      }[];
      message: string;
      error: boolean;
      source: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
      blockcode: string;
      fromFCC: boolean;
    };
  };
  internetProviders: InternetProvider[];
  schools: School[];
  utilities: Utility[];
}

export async function getFullPropertyData(id: number): Promise<PropertyFullData> {
  const res = await apiRequest("GET", `/api/property-full/${id}`, undefined);
  return res.json();
}
