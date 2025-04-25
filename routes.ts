import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPropertySchema, insertInternetProviderSchema, insertSchoolSchema, insertUtilitySchema } from "@shared/schema";
import { z } from "zod";
import { geocodingService, PropertySearchResult } from "./geocoding-service";
import { getStorageImplementation, checkDatabaseConfig } from "./deployment-helper";
import { fccApiService } from "./fcc-api-service";
import autocompleteRouter from "./routes/autocomplete";

// Get the appropriate storage implementation - handles both memory and database
// with graceful fallback mechanisms for deployment
const storageImpl = getStorageImplementation();

// Log database configuration status for diagnostic purposes
checkDatabaseConfig().then(dbConfig => {
  console.log(`Database configuration status: ${dbConfig.isDbConfigured ? 'Available' : 'Unavailable'}`);
  console.log(`Database message: ${dbConfig.message}`);
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  const apiRouter = express.Router();
  
  // Property routes
  // Search and address routes must come BEFORE the :id route to avoid being overridden
  apiRouter.get("/properties/search", async (req: Request, res: Response) => {
    console.log("Search API route hit with parameters:", req.query);
    const query = req.query.q as string;
    
    if (!query || query.length < 3) {
      console.log("Invalid search query - less than 3 characters:", query);
      return res.status(400).json({ message: "Search query must be at least 3 characters" });
    }
    
    try {
      console.log("Searching properties with query:", query);
      
      // First, search in our database
      console.log("Step 1: Searching in database");
      const properties = await storageImpl.searchProperties(query);
      
      // If we found some properties, return them
      if (properties.length > 0) {
        console.log("Found properties in database:", properties.length);
        console.log("Sample property:", JSON.stringify(properties[0]));
        return res.json({
          success: true,
          results: properties,
          count: properties.length,
          message: "Properties found in database"
        });
      }
      
      // If we didn't find any properties, try the geocoding service
      console.log("Step 2: No properties found in database, trying geocoding service");
      
      // Real address search using geocoding service
      console.log(`Calling geocodingService.searchRealEstateByAddress with query "${query}"`);
      const geocodingResults = await geocodingService.searchRealEstateByAddress(query);
      console.log(`Geocoding results received, count: ${geocodingResults ? geocodingResults.length : 'null'}`);
      
      if (geocodingResults && geocodingResults.length > 0) {
        console.log("Found properties via geocoding:", geocodingResults.length);
        console.log("First geocoding result:", JSON.stringify(geocodingResults[0]));
        
        // Convert to property format with unique temporary IDs
        const mappedResults = geocodingResults.map((result, index) => {
          const property = {
            id: -(index + 1), // Negative IDs to avoid conflicts with DB IDs
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
          };
          
          console.log(`Mapped property ${index + 1}:`, JSON.stringify(property));
          return property;
        });
        
        console.log("Returning mapped results");
        return res.json({
          success: true,
          results: mappedResults,
          count: mappedResults.length,
          message: "Properties found via geocoding service"
        });
      }
      
      // If we still didn't find anything via geocoding service, let's try getting census block info and broadband data
      console.log("Step 3: No properties found in database or via geocoding service. Trying Census + FCC lookup");
      
      try {
        // Import census geocoding service
        const { censusGeocodingService } = require('./census-geocoding-service');
        
        // Get block info from address
        const blockResult = await censusGeocodingService.getBlockInfoFromAddress(query);
        
        if (blockResult.success && blockResult.blockInfo) {
          console.log(`Step 4: Census block found for query: ${blockResult.blockInfo.geoid}`);
          
          // Get broadband data using the latitude and longitude from census block
          const lat = blockResult.blockInfo.latitude;
          const lng = blockResult.blockInfo.longitude;
          const broadbandData = await fccApiService.getBroadbandData(lat, lng);
          
          // If we found broadband providers, create a generic property
          if (broadbandData.providers && broadbandData.providers.length > 0) {
            console.log(`Step 5: Found ${broadbandData.providers.length} broadband providers from FCC data`);
            
            // Create a generic property with the address from the query
            const genericProperty = {
              id: -1, // Negative ID to indicate it's not in the database
              address: query,
              city: broadbandData.censusBlock?.county || "Unknown",
              state: broadbandData.censusBlock?.state || "Unknown",
              zip: "",
              latitude: lat,
              longitude: lng,
              propertyType: "Address", // Indicate it's just an address, not a property in our DB
              sqft: null,
              beds: null,
              baths: null,
              price: null,
              lastUpdated: new Date(),
              censusBlock: blockResult.blockInfo,
              broadbandData: {
                providers: broadbandData.providers.map(provider => ({
                  name: provider.name,
                  technologies: provider.technologies.map(tech => tech.type),
                  maxDownload: Math.max(...provider.technologies.map(tech => tech.maxDownloadSpeed)),
                  maxUpload: Math.max(...provider.technologies.map(tech => tech.maxUploadSpeed)),
                  source: broadbandData.source || "FCC"
                })),
                message: "Data from FCC Broadband Map",
                error: false,
                source: broadbandData.source || "fcc",
                coordinates: {
                  latitude: lat,
                  longitude: lng
                },
                blockcode: blockResult.blockInfo.geoid,
                fromFCC: true
              }
            };
            
            // Return result wrapped in the expected format
            return res.json({ 
              success: true,
              results: [genericProperty],
              count: 1,
              message: "No property record found, but broadband data is available for this address"
            });
          }
        }
      } catch (censusError) {
        console.error("Error during Census/FCC lookup:", censusError);
      }
      
      // If all methods failed, return an empty results array in the object format
      console.log("Step 6: All methods failed, no data found");
      return res.json({
        success: false,
        results: [],
        count: 0,
        message: "No properties or broadband data found matching your search criteria"
      });
      
    } catch (error) {
      console.error("Error in search API:", error);
      res.status(500).json({ message: "Error searching properties", error: String(error) });
    }
  });
  
  apiRouter.get("/properties/address/:address", async (req: Request, res: Response) => {
    const address = req.params.address;
    
    if (!address) {
      return res.status(400).json({ message: "Address is required" });
    }
    
    const property = await storageImpl.getPropertyByAddress(address);
    
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    
    res.json(property);
  });
  
  // The ID route should come AFTER more specific routes
  apiRouter.get("/properties/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid property ID" });
    }
    
    const property = await storageImpl.getPropertyById(id);
    
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    
    res.json(property);
  });
  
  apiRouter.post("/properties", async (req: Request, res: Response) => {
    try {
      const validatedData = insertPropertySchema.parse(req.body);
      const property = await storageImpl.createProperty(validatedData);
      res.status(201).json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid property data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to create property" });
    }
  });
  
  // Internet provider routes
  apiRouter.get("/properties/:propertyId/internet", async (req: Request, res: Response) => {
    const propertyId = parseInt(req.params.propertyId);
    
    if (isNaN(propertyId)) {
      return res.status(400).json({ message: "Invalid property ID" });
    }
    
    const providers = await storageImpl.getInternetProvidersByPropertyId(propertyId);
    res.json(providers);
  });
  
  apiRouter.post("/internet-providers", async (req: Request, res: Response) => {
    try {
      const validatedData = insertInternetProviderSchema.parse(req.body);
      const provider = await storageImpl.createInternetProvider(validatedData);
      res.status(201).json(provider);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid internet provider data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to create internet provider" });
    }
  });
  
  // School routes
  apiRouter.get("/properties/:propertyId/schools", async (req: Request, res: Response) => {
    const propertyId = parseInt(req.params.propertyId);
    
    if (isNaN(propertyId)) {
      return res.status(400).json({ message: "Invalid property ID" });
    }
    
    const schools = await storageImpl.getSchoolsByPropertyId(propertyId);
    res.json(schools);
  });
  
  apiRouter.post("/schools", async (req: Request, res: Response) => {
    try {
      const validatedData = insertSchoolSchema.parse(req.body);
      const school = await storageImpl.createSchool(validatedData);
      res.status(201).json(school);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid school data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to create school" });
    }
  });
  
  // Utility routes
  apiRouter.get("/properties/:propertyId/utilities", async (req: Request, res: Response) => {
    const propertyId = parseInt(req.params.propertyId);
    
    if (isNaN(propertyId)) {
      return res.status(400).json({ message: "Invalid property ID" });
    }
    
    const utilities = await storageImpl.getUtilitiesByPropertyId(propertyId);
    res.json(utilities);
  });
  
  apiRouter.post("/utilities", async (req: Request, res: Response) => {
    try {
      const validatedData = insertUtilitySchema.parse(req.body);
      const utility = await storageImpl.createUtility(validatedData);
      res.status(201).json(utility);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid utility data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to create utility" });
    }
  });
  
  // External integrations
  apiRouter.get("/broadband-data", async (req: Request, res: Response) => {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }
    
    try {
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ message: "Invalid latitude or longitude values" });
      }
      
      const broadbandData = await storageImpl.getBroadbandData(latitude, longitude);
      res.json(broadbandData);
    } catch (error) {
      console.error("Error retrieving broadband data:", error);
      res.status(500).json({ 
        message: "Failed to retrieve broadband data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Address to broadband data endpoint
  apiRouter.get("/address-broadband", async (req: Request, res: Response) => {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ message: "Address is required" });
    }
    
    try {
      console.log(`Geocoding address: ${address} for broadband lookup`);
      
      // First, geocode the address to get coordinates
      const geocodingResult = await geocodingService.geocodeAddress(address as string);
      
      if (!geocodingResult) {
        return res.status(404).json({ 
          message: "Could not geocode the provided address",
          success: false 
        });
      }
      
      const { latitude, longitude } = geocodingResult;
      console.log(`Address geocoded to lat: ${latitude}, lng: ${longitude}`);
      
      // Now get broadband data for these coordinates
      const broadbandData = await storageImpl.getBroadbandData(latitude, longitude);
      
      // Return both the geocoded address and the broadband data
      res.json({
        success: true,
        location: {
          address: geocodingResult.address,
          city: geocodingResult.city,
          state: geocodingResult.state,
          zip: geocodingResult.zip,
          latitude: geocodingResult.latitude,
          longitude: geocodingResult.longitude
        },
        broadbandData
      });
    } catch (error) {
      console.error("Error retrieving broadband data by address:", error);
      res.status(500).json({ 
        message: "Failed to retrieve broadband data",
        error: error instanceof Error ? error.message : "Unknown error",
        success: false
      });
    }
  });
  
  // Full property data
  apiRouter.get("/property-full/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid property ID" });
    }
    
    const property = await storageImpl.getPropertyById(id);
    
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    
    const internetProviders = await storageImpl.getInternetProvidersByPropertyId(property.id);
    const schools = await storageImpl.getSchoolsByPropertyId(property.id);
    const utilities = await storageImpl.getUtilitiesByPropertyId(property.id);
    
    res.json({
      property,
      internetProviders,
      schools,
      utilities
    });
  });
  
  // Health check endpoint
  apiRouter.get("/health", async (req: Request, res: Response) => {
    // Get database status asynchronously
    const dbStatus = await checkDatabaseConfig();
    
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: {
        available: dbStatus.isDbConfigured,
        message: dbStatus.message
      },
      storage: {
        type: storageImpl.constructor.name, // Will show "MemStorage" or "DatabaseStorage"
        memory_only: storageImpl.constructor.name === "MemStorage"
      },
      environment: process.env.NODE_ENV || "development"
    });
  });
  
  // Direct FCC Broadband API endpoint with Census block lookup
  apiRouter.get("/fcc-broadband", async (req: Request, res: Response) => {
    try {
      const { latitude, longitude, address } = req.query;
      
      // If we have an address but no coordinates, use Census geocoding
      if (address && (!latitude || !longitude)) {
        try {
          console.log(`Getting broadband data using address: ${address}`);
          
          // Import census geocoding service
          const { censusGeocodingService } = require('./census-geocoding-service');
          
          // Get block info from address
          const blockResult = await censusGeocodingService.getBlockInfoFromAddress(address as string);
          
          if (!blockResult.success || !blockResult.blockInfo) {
            return res.status(400).json({
              success: false,
              error: `Failed to geocode address: ${blockResult.error}`
            });
          }
          
          // Use the coordinates from the block info
          const lat = blockResult.blockInfo.latitude;
          const lng = blockResult.blockInfo.longitude;
          
          console.log(`Address converted to coordinates: ${lat}, ${lng}`);
          
          // Get broadband data using these coordinates
          const broadbandData = await fccApiService.getBroadbandData(lat, lng);
          
          return res.json({
            ...broadbandData,
            address: address,
            // Ensure census block info is included
            censusBlock: broadbandData.censusBlock || (blockResult.blockInfo ? {
              blockcode: blockResult.blockInfo.geoid,
              state: blockResult.blockInfo.state,
              county: blockResult.blockInfo.county,
              latitude: blockResult.blockInfo.latitude,
              longitude: blockResult.blockInfo.longitude
            } : undefined)
          });
        } catch (addressError) {
          console.error('Error processing address:', addressError);
          return res.status(500).json({
            success: false,
            error: `Failed to process address: ${String(addressError)}`
          });
        }
      }
      
      // Otherwise, require coordinates
      if (!latitude || !longitude) {
        return res.status(400).json({ 
          success: false, 
          error: 'Either address OR latitude and longitude are required parameters' 
        });
      }
      
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Latitude and longitude must be valid numbers' 
        });
      }
      
      // Get broadband data from FCC API
      const broadbandData = await fccApiService.getBroadbandData(lat, lng);
      
      return res.json(broadbandData);
    } catch (error) {
      console.error('Error fetching broadband data:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve broadband data' 
      });
    }
  });
  
  // Test endpoint for FCC API authentication with comprehensive debugging
  apiRouter.get("/fcc-api-test", async (req: Request, res: Response) => {
    try {
      // Test coordinates (Rochester, NY)
      const testLat = 43.2155851;
      const testLng = -77.7118499;
      
      // Use client-provided coordinates if available
      if (req.query.lat && req.query.lng) {
        const lat = parseFloat(req.query.lat as string);
        const lng = parseFloat(req.query.lng as string);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          console.log(`Using client-provided coordinates: ${lat}, ${lng}`);
          
          // Import the debug helper
          const { testFccApis } = await import('./fcc-api-debug');
          
          // Run comprehensive API tests
          const debugResults = await testFccApis(lat, lng);
          
          return res.json({
            success: true,
            message: 'FCC API debug test completed',
            coordinates: { latitude: lat, longitude: lng },
            results: debugResults
          });
        }
      }
      
      // Import the debug helper
      const { testFccApis } = await import('./fcc-api-debug');
      
      // Run comprehensive API tests
      const debugResults = await testFccApis(testLat, testLng);
      
      return res.json({
        success: true,
        message: 'FCC API debug test completed',
        coordinates: { latitude: testLat, longitude: testLng },
        results: debugResults
      });
    } catch (error) {
      console.error('Error testing FCC API:', error);
      return res.status(500).json({ error: true, message: String(error) });
    }
  });
  
  // Add our autocomplete router to the API router
  apiRouter.use(autocompleteRouter);
  
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
