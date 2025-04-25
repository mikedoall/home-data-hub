import {
  users, User, InsertUser,
  properties, Property, InsertProperty,
  internetProviders, InternetProvider, InsertInternetProvider,
  schools, School, InsertSchool,
  utilities, Utility, InsertUtility
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Property operations
  getPropertyById(id: number): Promise<Property | undefined>;
  getPropertyByAddress(address: string): Promise<Property | undefined>;
  searchProperties(query: string): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  
  // Internet provider operations
  getInternetProvidersByPropertyId(propertyId: number): Promise<InternetProvider[]>;
  createInternetProvider(provider: InsertInternetProvider): Promise<InternetProvider>;
  
  // School operations
  getSchoolsByPropertyId(propertyId: number): Promise<School[]>;
  createSchool(school: InsertSchool): Promise<School>;
  
  // Utility operations
  getUtilitiesByPropertyId(propertyId: number): Promise<Utility[]>;
  createUtility(utility: InsertUtility): Promise<Utility>;
  
  // FCC Broadband Map operations
  getBroadbandData(latitude: number, longitude: number): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private properties: Map<number, Property>;
  private internetProviders: Map<number, InternetProvider>;
  private schools: Map<number, School>;
  private utilities: Map<number, Utility>;
  
  private userId: number;
  private propertyId: number;
  private internetProviderId: number;
  private schoolId: number;
  private utilityId: number;

  constructor() {
    this.users = new Map();
    this.properties = new Map();
    this.internetProviders = new Map();
    this.schools = new Map();
    this.utilities = new Map();
    
    this.userId = 1;
    this.propertyId = 1;
    this.internetProviderId = 1;
    this.schoolId = 1;
    this.utilityId = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Property methods
  async getPropertyById(id: number): Promise<Property | undefined> {
    return this.properties.get(id);
  }
  
  async getPropertyByAddress(address: string): Promise<Property | undefined> {
    return Array.from(this.properties.values()).find(
      (property) => property.address.toLowerCase().includes(address.toLowerCase())
    );
  }
  
  async searchProperties(query: string): Promise<Property[]> {
    const lowerQuery = query.toLowerCase();
    console.log(`MemStorage.searchProperties: Searching for "${lowerQuery}" in ${this.properties.size} properties`);
    
    // Get direct matches from memory DB
    const memResults = Array.from(this.properties.values()).filter(
      (property) => 
        property.address.toLowerCase().includes(lowerQuery) ||
        property.city.toLowerCase().includes(lowerQuery) ||
        property.state.toLowerCase().includes(lowerQuery) ||
        property.zip.includes(lowerQuery)
    );
    
    // If we have results from memory, return them
    if (memResults.length > 0) {
      console.log(`MemStorage.searchProperties: Found ${memResults.length} properties in memory store`);
      return memResults;
    }
    
    // At this point, we need to re-import the geocoding service
    // This is a bit of a hack, but it allows us to use it without circular imports
    console.log(`MemStorage.searchProperties: No results in memory store, trying geocoding service`);
    
    try {
      // Import the geocoding service dynamically to avoid circular dependencies
      const { geocodingService } = await import('./geocoding-service');
      
      // Search for address using geocoding service (generates fallback results if API fails)
      const geocodingResults = await geocodingService.searchRealEstateByAddress(query);
      
      if (geocodingResults.length > 0) {
        console.log(`MemStorage.searchProperties: Found ${geocodingResults.length} properties via geocoding`);
        
        // Convert to Property objects with negative IDs (to avoid conflicts)
        return geocodingResults.map((result, index) => ({
          id: -(index + 1), // Use negative IDs to avoid conflicts with DB IDs
          address: result.address,
          city: result.city,
          state: result.state,
          zip: result.zip,
          latitude: result.latitude,
          longitude: result.longitude,
          propertyType: null,
          sqft: null,
          beds: null,
          baths: null,
          price: null,
          lastUpdated: new Date()
        }));
      }
    } catch (error) {
      console.error('Error in fallback geocoding search:', error);
    }
    
    // If all else fails, return empty array
    console.log(`MemStorage.searchProperties: No results found for "${query}"`);
    return [];
  }
  
  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = this.propertyId++;
    const lastUpdated = new Date();
    const property: Property = { ...insertProperty, id, lastUpdated };
    this.properties.set(id, property);
    return property;
  }
  
  // Internet provider methods
  async getInternetProvidersByPropertyId(propertyId: number): Promise<InternetProvider[]> {
    return Array.from(this.internetProviders.values()).filter(
      (provider) => provider.propertyId === propertyId
    );
  }
  
  async createInternetProvider(insertProvider: InsertInternetProvider): Promise<InternetProvider> {
    const id = this.internetProviderId++;
    const provider: InternetProvider = { ...insertProvider, id };
    this.internetProviders.set(id, provider);
    return provider;
  }
  
  // School methods
  async getSchoolsByPropertyId(propertyId: number): Promise<School[]> {
    return Array.from(this.schools.values()).filter(
      (school) => school.propertyId === propertyId
    );
  }
  
  async createSchool(insertSchool: InsertSchool): Promise<School> {
    const id = this.schoolId++;
    const school: School = { ...insertSchool, id };
    this.schools.set(id, school);
    return school;
  }
  
  // Utility methods
  async getUtilitiesByPropertyId(propertyId: number): Promise<Utility[]> {
    return Array.from(this.utilities.values()).filter(
      (utility) => utility.propertyId === propertyId
    );
  }
  
  async createUtility(insertUtility: InsertUtility): Promise<Utility> {
    const id = this.utilityId++;
    const utility: Utility = { ...insertUtility, id };
    this.utilities.set(id, utility);
    return utility;
  }
  
  // FCC Broadband Map methods
  async getBroadbandData(latitude: number, longitude: number): Promise<any> {
    try {
      console.log(`MemStorage.getBroadbandData: Fetching data for lat: ${latitude}, lng: ${longitude}`);
      
      // Import the FCC API service dynamically to avoid circular dependencies
      const { fccApiService } = await import('./fcc-api-service');
      
      // Try both APIs (Open Data and traditional FCC API)
      const result = await fccApiService.getBroadbandData(latitude, longitude);
      
      if (result.success && result.providers && result.providers.length > 0) {
        // Transform the data to match the format expected by the frontend
        return {
          providers: result.providers.map(provider => {
            // Combine all technologies for this provider into a readable array
            const techNames = provider.technologies.map(tech => tech.type)
              // Remove duplicates
              .filter((value, index, self) => self.indexOf(value) === index)
              // Simplify some names for readability
              .map(name => {
                if (name.includes('Fiber')) return 'Fiber';
                if (name.includes('Cable')) return 'Cable';
                if (name.includes('DSL')) return 'DSL';
                if (name.includes('Wireless')) return 'Fixed Wireless';
                if (name.includes('Satellite')) return 'Satellite';
                return name;
              });
            
            // Find highest download and upload speeds across all technologies
            const maxDownload = Math.max(...provider.technologies.map(tech => tech.maxDownloadSpeed || 0));
            const maxUpload = Math.max(...provider.technologies.map(tech => tech.maxUploadSpeed || 0));
            
            return {
              name: provider.dbaName || provider.name,
              technologies: techNames,
              maxDownload: maxDownload,
              maxUpload: maxUpload,
              source: `FCC ${result.source?.includes('open_data') ? 'Open Data API' : 'Broadband Map'}`
            };
          }),
          message: result.message || 'Data from FCC Broadband Map API',
          source: result.source,
          success: true
        };
      } else {
        throw new Error(result.error || 'No broadband data available');
      }
    } catch (error) {
      console.error('Error fetching FCC broadband data:', error);
      
      // If the direct API call fails, return structured info with clear regional data notice
      return { 
        providers: [
          {
            name: "AT&T",
            technologies: ["Fiber", "DSL"],
            maxDownload: 1000,
            maxUpload: 1000,
            source: "Regional approximation - not address specific"
          },
          {
            name: "Spectrum",
            technologies: ["Cable"],
            maxDownload: 940,
            maxUpload: 35,
            source: "Regional approximation - not address specific"
          },
          {
            name: "T-Mobile",
            technologies: ["Fixed Wireless"],
            maxDownload: 245,
            maxUpload: 31,
            source: "Regional approximation - not address specific"
          }
        ],
        message: "⚠️ Using regional approximation - FCC API unavailable. These providers may not be available at the specific address.",
        error: String(error)
      };
    }
  }
  
  // Initialize sample data
  private initializeSampleData() {
    // Add sample properties
    const sampleProperties: InsertProperty[] = [
      {
        address: "1234 Main Street",
        city: "Dallas",
        state: "TX",
        zip: "75201",
        propertyType: "Single Family",
        sqft: 2240,
        beds: 4,
        baths: 3,
        price: 450000
      },
      {
        address: "567 Oak Avenue",
        city: "Houston",
        state: "TX",
        zip: "77001",
        propertyType: "Condo",
        sqft: 1560,
        beds: 2,
        baths: 2,
        price: 320000
      },
      {
        address: "8910 Elm Street",
        city: "Austin",
        state: "TX",
        zip: "78701",
        propertyType: "Townhouse",
        sqft: 1950,
        beds: 3,
        baths: 2.5,
        price: 510000
      },
      {
        address: "420 Pine Road",
        city: "San Antonio",
        state: "TX",
        zip: "78205",
        propertyType: "Single Family",
        sqft: 2800,
        beds: 5,
        baths: 3,
        price: 495000
      },
      {
        address: "1100 Maple Lane",
        city: "Fort Worth",
        state: "TX",
        zip: "76102",
        propertyType: "Condo",
        sqft: 1200,
        beds: 2,
        baths: 1,
        price: 270000
      }
    ];
    
    const addPropertyWithData = async (propertyData: InsertProperty) => {
      const property = await this.createProperty(propertyData);
      
      // Add Internet providers
      const providers = [
        {
          propertyId: property.id,
          name: "AT&T Fiber",
          technology: "Fiber",
          maxDownload: 1000,
          maxUpload: 1000,
          startingPrice: "55",
          isAvailable: true
        },
        {
          propertyId: property.id,
          name: "Spectrum",
          technology: "Cable",
          maxDownload: 940,
          maxUpload: 35,
          startingPrice: "49.99",
          isAvailable: true
        },
        {
          propertyId: property.id,
          name: "T-Mobile Home Internet",
          technology: "5G/LTE",
          maxDownload: 245,
          maxUpload: 31,
          startingPrice: "50",
          isAvailable: true
        }
      ];
      
      providers.forEach(provider => this.createInternetProvider(provider));
      
      // Add Schools
      const schoolDistrict = property.city + " Independent School District";
      const schools = [
        {
          propertyId: property.id,
          name: property.city + " Elementary",
          type: "Elementary",
          address: "100 School Ave, " + property.city + ", " + property.state + " " + property.zip,
          district: schoolDistrict,
          rating: 8,
          studentTeacherRatio: "16:1"
        },
        {
          propertyId: property.id,
          name: property.city + " Middle School",
          type: "Middle",
          address: "200 Education Blvd, " + property.city + ", " + property.state + " " + property.zip,
          district: schoolDistrict,
          rating: 7,
          studentTeacherRatio: "18:1"
        },
        {
          propertyId: property.id,
          name: property.city + " High School",
          type: "High",
          address: "300 Learning Way, " + property.city + ", " + property.state + " " + property.zip,
          district: schoolDistrict,
          rating: 6,
          studentTeacherRatio: "20:1"
        }
      ];
      
      schools.forEach(school => this.createSchool(school));
      
      // Add Utilities
      const utilities = [
        {
          propertyId: property.id,
          type: "Electricity",
          provider: property.city + " Electric",
          estimatedCostMin: 110,
          estimatedCostMax: 180,
          additionalInfo: "Grid Operator: " + property.state + " Electric Delivery"
        },
        {
          propertyId: property.id,
          type: "Water",
          provider: "City of " + property.city + " Water Utilities",
          estimatedCostMin: 60,
          estimatedCostMax: 90,
          additionalInfo: "Billing Cycle: Monthly"
        },
        {
          propertyId: property.id,
          type: "Gas",
          provider: property.state + " Energy",
          estimatedCostMin: 30,
          estimatedCostMax: 120,
          additionalInfo: "Service Type: Residential"
        },
        {
          propertyId: property.id,
          type: "Trash",
          provider: "City of " + property.city + " Sanitation Services",
          estimatedCostMin: 30,
          estimatedCostMax: 30,
          additionalInfo: "Collection Schedule: Trash: Monday | Recycling: Thursday"
        }
      ];
      
      utilities.forEach(utility => this.createUtility(utility));
    };
    
    // Add all properties with their associated data
    for (const propertyData of sampleProperties) {
      addPropertyWithData(propertyData);
    }
  }
}

export const storage = new MemStorage();
