import { dbClient } from './db';
import { IStorage } from './storage';
import { eq, like, or, and, sql } from 'drizzle-orm';
import * as schema from '../shared/schema';
import { 
  User, InsertUser, 
  Property, InsertProperty, 
  InternetProvider, InsertInternetProvider,
  School, InsertSchool,
  Utility, InsertUtility,
  BroadbandProvider, BroadbandAvailability
} from '../shared/schema';

/**
 * Database implementation of the storage interface
 * Connects to PostgreSQL database for persistent storage
 */
export class DatabaseStorage implements IStorage {
  /**
   * Get a user by ID
   */
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await dbClient.select().from(schema.users).where(eq(schema.users.id, id));
    return user || undefined;
  }

  /**
   * Get a user by username
   */
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await dbClient
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username));
    return user || undefined;
  }

  /**
   * Create a new user
   */
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await dbClient
      .insert(schema.users)
      .values(insertUser)
      .returning();
    return user;
  }

  /**
   * Get a property by ID
   */
  async getPropertyById(id: number): Promise<Property | undefined> {
    const [property] = await dbClient
      .select()
      .from(schema.properties)
      .where(eq(schema.properties.id, id));
    return property || undefined;
  }

  /**
   * Get a property by address
   */
  async getPropertyByAddress(address: string): Promise<Property | undefined> {
    const [property] = await dbClient
      .select()
      .from(schema.properties)
      .where(eq(schema.properties.address, address));
    return property || undefined;
  }

  /**
   * Search for properties matching a query string
   * Searches address, city, state, and zip fields
   */
  async searchProperties(query: string): Promise<Property[]> {
    const normalizedQuery = query.trim().toLowerCase();
    const searchPattern = `%${normalizedQuery}%`;
    
    const properties = await dbClient
      .select()
      .from(schema.properties)
      .where(
        or(
          sql`LOWER(${schema.properties.address}) LIKE ${searchPattern}`,
          sql`LOWER(${schema.properties.city}) LIKE ${searchPattern}`,
          sql`LOWER(${schema.properties.state}) LIKE ${searchPattern}`,
          sql`LOWER(${schema.properties.zip}) LIKE ${searchPattern}`
        )
      )
      .limit(10);
    
    return properties;
  }

  /**
   * Create a new property
   */
  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const [property] = await dbClient
      .insert(schema.properties)
      .values({
        ...insertProperty,
        lastUpdated: new Date(),
      })
      .returning();
    return property;
  }

  /**
   * Get all internet providers for a property
   */
  async getInternetProvidersByPropertyId(propertyId: number): Promise<InternetProvider[]> {
    const providers = await dbClient
      .select()
      .from(schema.internetProviders)
      .where(eq(schema.internetProviders.propertyId, propertyId));
    return providers;
  }

  /**
   * Create a new internet provider
   */
  async createInternetProvider(insertProvider: InsertInternetProvider): Promise<InternetProvider> {
    const [provider] = await dbClient
      .insert(schema.internetProviders)
      .values(insertProvider)
      .returning();
    return provider;
  }

  /**
   * Get all schools for a property
   */
  async getSchoolsByPropertyId(propertyId: number): Promise<School[]> {
    const schools = await dbClient
      .select()
      .from(schema.schools)
      .where(eq(schema.schools.propertyId, propertyId));
    return schools;
  }

  /**
   * Create a new school
   */
  async createSchool(insertSchool: InsertSchool): Promise<School> {
    const [school] = await dbClient
      .insert(schema.schools)
      .values(insertSchool)
      .returning();
    return school;
  }

  /**
   * Get all utilities for a property
   */
  async getUtilitiesByPropertyId(propertyId: number): Promise<Utility[]> {
    const utilities = await dbClient
      .select()
      .from(schema.utilities)
      .where(eq(schema.utilities.propertyId, propertyId));
    return utilities;
  }

  /**
   * Create a new utility
   */
  async createUtility(insertUtility: InsertUtility): Promise<Utility> {
    const [utility] = await dbClient
      .insert(schema.utilities)
      .values(insertUtility)
      .returning();
    return utility;
  }

  /**
   * Get broadband data for a specific location
   */
  async getBroadbandData(latitude: number, longitude: number): Promise<any> {
    try {
      // Get broadband data from database using location
      const data = await this.getBroadbandDataFromDatabase(latitude, longitude);
      
      if (data && data.length > 0) {
        return this.formatBroadbandData(data);
      }
      
      console.log('No broadband data found in database, trying FCC API');
      
      // If no data in database, try getting it from the FCC API
      const apiData = await this.getBroadbandDataFromFccApi(latitude, longitude);
      
      // Return whatever we can get
      return apiData || { 
        success: false, 
        providers: [],
        message: 'No broadband data available for this location'
      };
    } catch (error) {
      console.error('Error getting broadband data:', error);
      return {
        success: false,
        error: String(error),
        providers: []
      };
    }
  }

  /**
   * Query the database for broadband availability data
   * Finds records within ~1km of the given coordinates
   */
  private async getBroadbandDataFromDatabase(latitude: number, longitude: number): Promise<any[]> {
    // Convert coordinates to numeric values
    const lat = Number(latitude);
    const lng = Number(longitude);
    
    // Use a small radius around the coordinates (approximately 1km)
    const latRadius = 0.01; // roughly 1km in latitude
    const lngRadius = 0.01; // roughly 1km in longitude 
    
    // Query broadband availability data near this location
    // Join with provider information
    const broadbandData = await dbClient
      .select({
        provider: schema.broadbandProviders,
        availability: schema.broadbandAvailability
      })
      .from(schema.broadbandAvailability)
      .innerJoin(
        schema.broadbandProviders,
        eq(schema.broadbandAvailability.frn, schema.broadbandProviders.frn)
      )
      .where(
        and(
          sql`${schema.broadbandAvailability.latitude} >= ${lat - latRadius}`,
          sql`${schema.broadbandAvailability.latitude} <= ${lat + latRadius}`,
          sql`${schema.broadbandAvailability.longitude} >= ${lng - lngRadius}`,
          sql`${schema.broadbandAvailability.longitude} <= ${lng + lngRadius}`
        )
      )
      .limit(50);

    return broadbandData;
  }

  /**
   * Format broadband data for the API response
   */
  private async formatBroadbandData(data: any[]): Promise<any> {
    try {
      // Group by provider
      const groupedByProvider = new Map();
      
      for (const entry of data) {
        const { provider, availability } = entry;
        
        if (!groupedByProvider.has(provider.frn)) {
          groupedByProvider.set(provider.frn, {
            name: provider.providerName,
            dbaName: provider.providerDbaName || provider.providerName,
            type: provider.providerType || 'Unknown',
            holdingCompany: provider.holdingCompanyName || null,
            technologies: []
          });
        }
        
        // Add technology details
        const providerEntry = groupedByProvider.get(provider.frn);
        providerEntry.technologies.push({
          type: this.getTechnologyName(availability.technologyCode),
          technologyCode: availability.technologyCode,
          maxDownloadSpeed: availability.maxDownload,
          maxUploadSpeed: availability.maxUpload,
          blockId: availability.blockId,
          county: availability.county,
          state: availability.stateAbbr
        });
      }
      
      // Convert to array of providers
      const providers = [];
      groupedByProvider.forEach((providerData) => {
        providers.push(providerData);
      });
      
      return {
        success: true,
        count: providers.length,
        providers
      };
    } catch (error) {
      console.error('Error formatting broadband data:', error);
      return {
        success: false,
        error: String(error),
        providers: []
      };
    }
  }

  /**
   * Get broadband data from the FCC API directly
   * Used as a fallback when database doesn't have data
   */
  private async getBroadbandDataFromFccApi(latitude: number, longitude: number): Promise<any> {
    try {
      // Check for API key
      const apiKey = process.env.FCC_BROADBAND_API_KEY;
      if (!apiKey) {
        throw new Error('FCC_BROADBAND_API_KEY not configured');
      }
      
      // Call the FCC API
      const url = `https://broadbandmap.fcc.gov/nbm/map/api/published/fixed/location?latitude=${latitude}&longitude=${longitude}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'username': process.env.FCC_USERNAME || 'wmstevens@allchoiceconnect.com',
          'hash_value': apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`FCC API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Format the API response to match our format
      return {
        success: true,
        count: data?.providerRecords?.length || 0,
        providers: data?.providerRecords?.map((provider: any) => ({
          name: provider.providerName,
          dbaName: provider.dbaName,
          type: provider.providerType || 'Unknown',
          holdingCompany: provider.holdingCompanyName,
          technologies: provider.technologies.map((tech: any) => ({
            type: this.getTechnologyName(tech.techCode),
            technologyCode: tech.techCode,
            maxDownloadSpeed: tech.maxAdDown,
            maxUploadSpeed: tech.maxAdUp,
            blockId: provider.blockId,
            county: provider.county,
            state: provider.state
          }))
        })) || []
      };
    } catch (error) {
      console.error('Error getting data from FCC API:', error);
      return null;
    }
  }

  /**
   * Convert FCC technology codes to readable names
   */
  private getTechnologyName(technologyCode: string): string {
    const technologies: {[key: string]: string} = {
      '10': 'Asymmetric xDSL',
      '11': 'ADSL2, ADSL2+',
      '12': 'VDSL',
      '20': 'Symmetric xDSL',
      '30': 'Other Copper Wireline',
      '40': 'Cable Modem - DOCSIS 1.0',
      '41': 'Cable Modem - DOCSIS 1.1',
      '42': 'Cable Modem - DOCSIS 2.0',
      '43': 'Cable Modem - DOCSIS 3.0',
      '44': 'Cable Modem - DOCSIS 3.1',
      '45': 'Cable Modem - DOCSIS 4.0',
      '50': 'Optical Carrier/Fiber to the End User',
      '60': 'Satellite',
      '70': 'Terrestrial Fixed Wireless',
      '71': 'Terrestrial Fixed Wireless - Licensed',
      '72': 'Terrestrial Fixed Wireless - Unlicensed',
      '73': 'Terrestrial Fixed Wireless - CBRS',
      '74': 'Terrestrial Fixed Wireless - 60GHz (802.11ad/ay)',
      '90': 'Electric Power Line',
      '0': 'Other'
    };
    
    return technologies[technologyCode] || `Unknown (${technologyCode})`;
  }

  /**
   * Initialize sample data for testing
   * Used when the database is empty
   */
  async initializeSampleData(): Promise<void> {
    try {
      // Check if we have any data already
      const [existingProperty] = await dbClient.select().from(schema.properties).limit(1);
      
      if (existingProperty) {
        console.log('Database already has data, skipping initialization');
        return;
      }
      
      console.log('Initializing sample data...');
      
      // Create a sample property
      const property = await this.createProperty({
        address: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
        propertyType: 'Single Family',
        sqft: 2000,
        beds: 3,
        baths: '2',
        price: 250000,
        latitude: '39.781721',
        longitude: '-89.650148'
      });
      
      // Create sample internet providers
      await this.createInternetProvider({
        name: 'Fiber Fast Internet',
        propertyId: property.id,
        technology: 'Fiber',
        maxDownload: 1000,
        maxUpload: 1000,
        startingPrice: '$70/month',
        isAvailable: true
      });
      
      await this.createInternetProvider({
        name: 'Cable Company',
        propertyId: property.id,
        technology: 'Cable',
        maxDownload: 300,
        maxUpload: 20,
        startingPrice: '$50/month',
        isAvailable: true
      });
      
      // Create sample schools
      await this.createSchool({
        name: 'Springfield Elementary',
        propertyId: property.id,
        type: 'Elementary',
        address: '200 School St, Springfield, IL 62701',
        district: 'Springfield School District',
        rating: 4.2,
        studentTeacherRatio: '18:1'
      });
      
      await this.createSchool({
        name: 'Springfield High',
        propertyId: property.id,
        type: 'High School',
        address: '300 High School Rd, Springfield, IL 62701',
        district: 'Springfield School District',
        rating: 3.8,
        studentTeacherRatio: '22:1'
      });
      
      // Create sample utilities
      await this.createUtility({
        type: 'Electric',
        propertyId: property.id,
        provider: 'Springfield Power',
        estimatedCostMin: 100,
        estimatedCostMax: 180,
        additionalInfo: 'Smart meters available'
      });
      
      await this.createUtility({
        type: 'Water',
        propertyId: property.id,
        provider: 'City of Springfield',
        estimatedCostMin: 40,
        estimatedCostMax: 70,
        additionalInfo: 'Water quality report available online'
      });
      
      console.log('Sample data initialization complete');
    } catch (error) {
      console.error('Error initializing sample data:', error);
    }
  }
}

// Create a singleton instance
export const databaseStorage = new DatabaseStorage();