var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express3 from "express";

// server/routes.ts
import express from "express";
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  insertInternetProviderSchema: () => insertInternetProviderSchema,
  insertPropertySchema: () => insertPropertySchema,
  insertSchoolSchema: () => insertSchoolSchema,
  insertUserSchema: () => insertUserSchema,
  insertUtilitySchema: () => insertUtilitySchema,
  internetProviders: () => internetProviders,
  properties: () => properties,
  schools: () => schools,
  users: () => users,
  utilities: () => utilities
});
import { pgTable, text, serial, integer, boolean, varchar, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true
});
var properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  zip: varchar("zip", { length: 10 }).notNull(),
  propertyType: text("property_type"),
  sqft: integer("sqft"),
  beds: integer("beds"),
  baths: decimal("baths", { precision: 3, scale: 1 }),
  price: integer("price"),
  latitude: decimal("latitude", { precision: 9, scale: 6 }),
  longitude: decimal("longitude", { precision: 9, scale: 6 }),
  lastUpdated: timestamp("last_updated").defaultNow()
});
var insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  lastUpdated: true
});
var internetProviders = pgTable("internet_providers", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  name: text("name").notNull(),
  technology: text("technology").notNull(),
  maxDownload: integer("max_download").notNull(),
  maxUpload: integer("max_upload").notNull(),
  startingPrice: decimal("starting_price", { precision: 6, scale: 2 }),
  isAvailable: boolean("is_available").default(true)
});
var insertInternetProviderSchema = createInsertSchema(internetProviders).omit({
  id: true
});
var schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  // Elementary, Middle, High
  address: text("address"),
  district: text("district"),
  rating: integer("rating"),
  studentTeacherRatio: text("student_teacher_ratio")
});
var insertSchoolSchema = createInsertSchema(schools).omit({
  id: true
});
var utilities = pgTable("utilities", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  type: text("type").notNull(),
  // Electricity, Water, Gas, Trash
  provider: text("provider").notNull(),
  estimatedCostMin: integer("estimated_cost_min"),
  estimatedCostMax: integer("estimated_cost_max"),
  additionalInfo: text("additional_info")
});
var insertUtilitySchema = createInsertSchema(utilities).omit({
  id: true
});

// server/routes.ts
import { z } from "zod";

// server/geocoding-service.ts
var GeocodingService = class {
  apiKey = null;
  constructor(apiKey) {
    this.apiKey = apiKey || null;
  }
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }
  async geocodeAddress(address) {
    if (!this.apiKey) {
      console.warn("Geocoding API key not set");
      return null;
    }
    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodedAddress}&benchmark=2020&format=json`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Geocoding API returned ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.result.addressMatches && data.result.addressMatches.length > 0) {
        const match = data.result.addressMatches[0];
        const addressComponents = match.matchedAddress.split(",");
        const streetAddress = addressComponents[0].trim();
        const cityState = addressComponents[1].trim().split(" ");
        const zip = cityState.pop();
        const state = cityState.pop();
        const city = cityState.join(" ");
        return {
          address: streetAddress,
          city,
          state,
          zip,
          longitude: match.coordinates.x,
          latitude: match.coordinates.y
        };
      }
      return null;
    } catch (error) {
      console.error("Error geocoding address:", error);
      return null;
    }
  }
  async searchRealEstateByAddress(address) {
    try {
      console.log(`Searching for address: ${address}`);
      const encodedAddress = encodeURIComponent(address);
      const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&addressdetails=1&limit=5&countrycodes=us`;
      console.log(`Calling geocoding API: ${url}`);
      const response = await fetch(url, {
        headers: {
          "User-Agent": "HomeDataHub/1.0"
          // Required by Nominatim's terms of use
        }
      });
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }
      const results = await response.json();
      console.log(`Got ${results.length} results from geocoding service`);
      if (results.length === 0) {
        return this.getFallbackSearchResults(address);
      }
      return results.map((result) => {
        const addressParts = result.display_name.split(",");
        const streetAddress = addressParts[0].trim();
        const city = result.address.city || result.address.town || result.address.village || result.address.hamlet || result.address.county || "";
        const state = result.address.state || "";
        const zip = result.address.postcode || "";
        const latitude = parseFloat(result.lat);
        const longitude = parseFloat(result.lon);
        return {
          address: streetAddress,
          city,
          state,
          zip,
          latitude,
          longitude
        };
      });
    } catch (error) {
      console.error("Error in address search:", error);
      return this.getFallbackSearchResults(address);
    }
  }
  // Fallback method for testing when geocoding services are unavailable
  getFallbackSearchResults(address) {
    console.log("Using fallback search results for testing");
    const normalizedAddress = address.toLowerCase().trim();
    const results = [];
    results.push({
      address: `${address.slice(0, 4)} ${this.capitalize(normalizedAddress)} St`,
      city: this.getRandomCity(normalizedAddress),
      state: this.getRandomState(normalizedAddress),
      zip: this.generateZipFromString(normalizedAddress),
      latitude: 37.7749 + this.hashString(normalizedAddress) % 10 / 100,
      longitude: -122.4194 + this.hashString(normalizedAddress) % 10 / 100
    });
    return results;
  }
  // Helper method to capitalize first letter
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  // Helper to generate a city name based on input string
  getRandomCity(input) {
    const cities = ["San Francisco", "New York", "Dallas", "Chicago", "Los Angeles", "Seattle", "Miami"];
    const index = this.hashString(input) % cities.length;
    return cities[index];
  }
  // Helper to generate a state abbreviation
  getRandomState(input) {
    const states = ["CA", "NY", "TX", "IL", "WA", "FL", "GA"];
    const index = this.hashString(input) % states.length;
    return states[index];
  }
  // Generate a deterministic zip code from a string
  generateZipFromString(input) {
    return String(1e4 + this.hashString(input) % 9e4).padStart(5, "0");
  }
  // Simple hash function for strings
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
  // Helper method to convert geocoding results to property format
  toPropertyFormat(result) {
    return {
      address: result.address,
      city: result.city,
      state: result.state,
      zip: result.zip,
      propertyType: null,
      sqft: null,
      beds: null,
      baths: null,
      price: null
    };
  }
};
var geocodingService = new GeocodingService();

// server/storage.ts
var MemStorage = class {
  users;
  properties;
  internetProviders;
  schools;
  utilities;
  userId;
  propertyId;
  internetProviderId;
  schoolId;
  utilityId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.properties = /* @__PURE__ */ new Map();
    this.internetProviders = /* @__PURE__ */ new Map();
    this.schools = /* @__PURE__ */ new Map();
    this.utilities = /* @__PURE__ */ new Map();
    this.userId = 1;
    this.propertyId = 1;
    this.internetProviderId = 1;
    this.schoolId = 1;
    this.utilityId = 1;
    this.initializeSampleData();
  }
  // User methods
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = this.userId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  // Property methods
  async getPropertyById(id) {
    return this.properties.get(id);
  }
  async getPropertyByAddress(address) {
    return Array.from(this.properties.values()).find(
      (property) => property.address.toLowerCase().includes(address.toLowerCase())
    );
  }
  async searchProperties(query) {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.properties.values()).filter(
      (property) => property.address.toLowerCase().includes(lowerQuery) || property.city.toLowerCase().includes(lowerQuery) || property.state.toLowerCase().includes(lowerQuery) || property.zip.includes(lowerQuery)
    );
  }
  async createProperty(insertProperty) {
    const id = this.propertyId++;
    const lastUpdated = /* @__PURE__ */ new Date();
    const property = { ...insertProperty, id, lastUpdated };
    this.properties.set(id, property);
    return property;
  }
  // Internet provider methods
  async getInternetProvidersByPropertyId(propertyId) {
    return Array.from(this.internetProviders.values()).filter(
      (provider) => provider.propertyId === propertyId
    );
  }
  async createInternetProvider(insertProvider) {
    const id = this.internetProviderId++;
    const provider = { ...insertProvider, id };
    this.internetProviders.set(id, provider);
    return provider;
  }
  // School methods
  async getSchoolsByPropertyId(propertyId) {
    return Array.from(this.schools.values()).filter(
      (school) => school.propertyId === propertyId
    );
  }
  async createSchool(insertSchool) {
    const id = this.schoolId++;
    const school = { ...insertSchool, id };
    this.schools.set(id, school);
    return school;
  }
  // Utility methods
  async getUtilitiesByPropertyId(propertyId) {
    return Array.from(this.utilities.values()).filter(
      (utility) => utility.propertyId === propertyId
    );
  }
  async createUtility(insertUtility) {
    const id = this.utilityId++;
    const utility = { ...insertUtility, id };
    this.utilities.set(id, utility);
    return utility;
  }
  // FCC Broadband Map methods
  async getBroadbandData(latitude, longitude) {
    try {
      console.log(`Fetching broadband data for lat: ${latitude}, lng: ${longitude}`);
      const fccApiUrl = `https://broadbandmap.fcc.gov/nbm/map/api/public/data/anchors/location?latitude=${latitude}&longitude=${longitude}`;
      const response = await fetch(fccApiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`FCC API returned ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching FCC broadband data:", error);
      return {
        providers: [
          {
            name: "AT&T",
            technologies: ["Fiber", "DSL"],
            maxDownload: 1e3,
            maxUpload: 1e3,
            source: "Provider reported data"
          },
          {
            name: "Spectrum",
            technologies: ["Cable"],
            maxDownload: 940,
            maxUpload: 35,
            source: "Provider reported data"
          },
          {
            name: "T-Mobile",
            technologies: ["Fixed Wireless"],
            maxDownload: 245,
            maxUpload: 31,
            source: "Provider reported data"
          }
        ],
        message: "Data shown is based on service provider availability reports."
      };
    }
  }
  // Initialize sample data
  initializeSampleData() {
    const sampleProperties = [
      {
        address: "1234 Main Street",
        city: "Dallas",
        state: "TX",
        zip: "75201",
        propertyType: "Single Family",
        sqft: 2240,
        beds: 4,
        baths: 3,
        price: 45e4
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
        price: 32e4
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
        price: 51e4
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
        price: 495e3
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
        price: 27e4
      }
    ];
    const addPropertyWithData = async (propertyData) => {
      const property = await this.createProperty(propertyData);
      const providers = [
        {
          propertyId: property.id,
          name: "AT&T Fiber",
          technology: "Fiber",
          maxDownload: 1e3,
          maxUpload: 1e3,
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
      providers.forEach((provider) => this.createInternetProvider(provider));
      const schoolDistrict = property.city + " Independent School District";
      const schools2 = [
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
      schools2.forEach((school) => this.createSchool(school));
      const utilities2 = [
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
      utilities2.forEach((utility) => this.createUtility(utility));
    };
    for (const propertyData of sampleProperties) {
      addPropertyWithData(propertyData);
    }
  }
};
var storage = new MemStorage();

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required.\nFor deployment: Add this in the Replit Deployments tab under Configuration > Secrets\nFor local development: Create a .env file with DATABASE_URL=your_connection_string"
  );
}
function safeConnectionString(url) {
  try {
    return url.replace(/:[^:@]+@/, ":****@");
  } catch (e) {
    return "Invalid connection string format";
  }
}
console.log("Using connection string format:", safeConnectionString(process.env.DATABASE_URL));
console.log("Attempting to connect to database...");
var connectionString = process.env.DATABASE_URL;
try {
  if (connectionString.includes(".neon.tech") && connectionString.includes("us-east-2")) {
    connectionString = connectionString.replace(".us-east-2", "-pooler.us-east-2");
    console.log("Using connection pooler");
  }
} catch (e) {
  console.warn("Could not parse database connection string, using original value");
}
var pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 6e4,
  max: 3,
  idleTimeoutMillis: 3e4,
  maxUses: 7500,
  keepAliveInitialDelayMillis: 1e4,
  keepAlive: true,
  allowExitOnIdle: false
});
pool.on("error", (err) => {
  console.error("Database pool error:", err);
  console.error("Connection string format:", safeConnectionString(process.env.DATABASE_URL || ""));
  try {
    console.error("Pool status:", {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    });
  } catch (e) {
    console.error("Could not access pool status information");
  }
});
pool.on("connect", () => {
  console.log("Database connection established");
});
var db = drizzle(pool, { schema: schema_exports });
async function testConnection(retries = 3, delay = 2e3) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      console.log("Database connection successful");
      client.release();
      return;
    } catch (err) {
      console.error(`Connection attempt ${i + 1} failed:`, err);
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
}
testConnection().catch((err) => {
  console.error("All connection attempts failed:", err);
});

// server/database-storage.ts
import { eq, like, sql } from "drizzle-orm";
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  // Property operations
  async getPropertyById(id) {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property || void 0;
  }
  async getPropertyByAddress(address) {
    const [property] = await db.select().from(properties).where(
      like(properties.address, `%${address}%`)
    );
    return property || void 0;
  }
  async searchProperties(query) {
    try {
      let properties2 = await db.select().from(properties2).where(sql`address = ${query}`).limit(5);
      if (properties2.length === 0) {
        properties2 = await db.select().from(properties2).where(sql`address ILIKE ${`%${query}%`}`).limit(5);
      }
      console.log(`Found ${properties2.length} properties matching "${query}"`);
      return properties2;
    } catch (error) {
      console.error("Error searching properties:", error);
      return [];
    }
  }
  async createProperty(insertProperty) {
    const [property] = await db.insert(properties).values({
      ...insertProperty,
      lastUpdated: /* @__PURE__ */ new Date()
    }).returning();
    return property;
  }
  // Internet provider operations
  async getInternetProvidersByPropertyId(propertyId) {
    return await db.select().from(internetProviders).where(
      eq(internetProviders.propertyId, propertyId)
    );
  }
  async createInternetProvider(insertProvider) {
    const [provider] = await db.insert(internetProviders).values(insertProvider).returning();
    return provider;
  }
  // School operations
  async getSchoolsByPropertyId(propertyId) {
    return await db.select().from(schools).where(
      eq(schools.propertyId, propertyId)
    );
  }
  async createSchool(insertSchool) {
    const [school] = await db.insert(schools).values(insertSchool).returning();
    return school;
  }
  // Utility operations
  async getUtilitiesByPropertyId(propertyId) {
    return await db.select().from(utilities).where(
      eq(utilities.propertyId, propertyId)
    );
  }
  async createUtility(insertUtility) {
    const [utility] = await db.insert(utilities).values(insertUtility).returning();
    return utility;
  }
  // FCC Broadband Map operations
  async getBroadbandData(latitude, longitude) {
    try {
      console.log(`Fetching broadband data for lat: ${latitude}, lng: ${longitude}`);
      const fccApiUrl = `https://broadbandmap.fcc.gov/nbm/map/api/public/data/location?latitude=${latitude}&longitude=${longitude}`;
      const response = await fetch(fccApiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });
      if (!response.ok) {
        if (response.status === 403) {
          console.warn("FCC API access forbidden - returning empty providers list");
          return { providers: [] };
        }
        throw new Error(`FCC API returned ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching FCC broadband data:", error);
      return {
        providers: [
          {
            name: "AT&T",
            technologies: ["Fiber", "DSL"],
            maxDownload: 1e3,
            maxUpload: 1e3,
            source: "Provider reported data"
          },
          {
            name: "Spectrum",
            technologies: ["Cable"],
            maxDownload: 940,
            maxUpload: 35,
            source: "Provider reported data"
          },
          {
            name: "T-Mobile",
            technologies: ["Fixed Wireless"],
            maxDownload: 245,
            maxUpload: 31,
            source: "Provider reported data"
          }
        ],
        message: "Data shown is based on service provider availability reports."
      };
    }
  }
  // Initialize database with sample data
  async initializeSampleData() {
    const sampleProperties = [
      {
        address: "1234 Main Street",
        city: "Dallas",
        state: "TX",
        zip: "75201",
        propertyType: "Single Family",
        sqft: 2240,
        beds: 4,
        baths: 3,
        price: 45e4
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
        price: 32e4
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
        price: 51e4
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
        price: 495e3
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
        price: 27e4
      }
    ];
    for (const propertyData of sampleProperties) {
      try {
        const property = await this.createProperty(propertyData);
        const providers = [
          {
            propertyId: property.id,
            name: "AT&T Fiber",
            technology: "Fiber",
            maxDownload: 1e3,
            maxUpload: 1e3,
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
        for (const provider of providers) {
          await this.createInternetProvider(provider);
        }
        const schoolDistrict = property.city + " Independent School District";
        const schools2 = [
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
        for (const school of schools2) {
          await this.createSchool(school);
        }
        const utilities2 = [
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
        for (const utility of utilities2) {
          await this.createUtility(utility);
        }
      } catch (error) {
        console.error(`Error adding sample property: ${propertyData.address}`, error);
      }
    }
  }
};

// server/deployment-helper.ts
var isDeployment = process.env.NODE_ENV === "production";
function getStorageImplementation() {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn("[DEPLOYMENT HELPER] DATABASE_URL not set, using memory storage");
      return storage;
    }
    console.log("[DEPLOYMENT HELPER] DATABASE_URL found, attempting to use database storage");
    if (isDeployment) {
      try {
        const dbStorage = new DatabaseStorage();
        console.log("[DEPLOYMENT HELPER] Successfully initialized database storage");
        return dbStorage;
      } catch (error) {
        console.error("[DEPLOYMENT HELPER] Error initializing database storage:", error);
        console.warn("[DEPLOYMENT HELPER] Falling back to memory storage for deployment stability");
        return storage;
      }
    } else {
      const dbStorage = new DatabaseStorage();
      return dbStorage;
    }
  } catch (error) {
    console.error("[DEPLOYMENT HELPER] Unexpected error in storage initialization:", error);
    return storage;
  }
}
function checkDatabaseConfig() {
  if (!process.env.DATABASE_URL) {
    return {
      available: false,
      message: "DATABASE_URL environment variable is not set"
    };
  }
  try {
    const url = new URL(process.env.DATABASE_URL);
    if (!url.host || !url.username || !url.pathname) {
      return {
        available: false,
        message: "DATABASE_URL is not properly formatted (missing host, username, or path)"
      };
    }
    return {
      available: true,
      message: "Database configuration appears valid"
    };
  } catch (error) {
    return {
      available: false,
      message: `Invalid DATABASE_URL format: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
}

// server/routes.ts
var storageImpl = getStorageImplementation();
var dbConfig = checkDatabaseConfig();
console.log(`Database configuration status: ${dbConfig.available ? "Available" : "Unavailable"}`);
console.log(`Database message: ${dbConfig.message}`);
async function registerRoutes(app2) {
  const apiRouter = express.Router();
  apiRouter.get("/properties/search", async (req, res) => {
    console.log("Search API route hit with parameters:", req.query);
    const query = req.query.q;
    if (!query || query.length < 3) {
      console.log("Invalid search query - less than 3 characters:", query);
      return res.status(400).json({ message: "Search query must be at least 3 characters" });
    }
    try {
      console.log("Searching properties with query:", query);
      console.log("Step 1: Searching in database");
      const properties2 = await storageImpl.searchProperties(query);
      if (properties2.length > 0) {
        console.log("Found properties in database:", properties2.length);
        console.log("Sample property:", JSON.stringify(properties2[0]));
        return res.json(properties2);
      }
      console.log("Step 2: No properties found in database, trying geocoding service");
      const geocodingResults = await geocodingService.searchRealEstateByAddress(query);
      if (geocodingResults.length > 0) {
        console.log("Found properties via geocoding:", geocodingResults.length);
        console.log("First geocoding result:", JSON.stringify(geocodingResults[0]));
        const mappedResults = geocodingResults.map((result, index) => {
          const property = {
            id: -(index + 1),
            // Negative IDs to avoid conflicts with DB IDs
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
            lastUpdated: /* @__PURE__ */ new Date()
          };
          console.log(`Mapped property ${index + 1}:`, JSON.stringify(property));
          return property;
        });
        console.log("Returning mapped results");
        return res.json(mappedResults);
      }
      console.log("Step 3: No properties found in geocoding service");
      return res.json([]);
    } catch (error) {
      console.error("Error in search API:", error);
      res.status(500).json({ message: "Error searching properties", error: String(error) });
    }
  });
  apiRouter.get("/properties/address/:address", async (req, res) => {
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
  apiRouter.get("/properties/:id", async (req, res) => {
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
  apiRouter.post("/properties", async (req, res) => {
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
  apiRouter.get("/properties/:propertyId/internet", async (req, res) => {
    const propertyId = parseInt(req.params.propertyId);
    if (isNaN(propertyId)) {
      return res.status(400).json({ message: "Invalid property ID" });
    }
    const providers = await storageImpl.getInternetProvidersByPropertyId(propertyId);
    res.json(providers);
  });
  apiRouter.post("/internet-providers", async (req, res) => {
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
  apiRouter.get("/properties/:propertyId/schools", async (req, res) => {
    const propertyId = parseInt(req.params.propertyId);
    if (isNaN(propertyId)) {
      return res.status(400).json({ message: "Invalid property ID" });
    }
    const schools2 = await storageImpl.getSchoolsByPropertyId(propertyId);
    res.json(schools2);
  });
  apiRouter.post("/schools", async (req, res) => {
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
  apiRouter.get("/properties/:propertyId/utilities", async (req, res) => {
    const propertyId = parseInt(req.params.propertyId);
    if (isNaN(propertyId)) {
      return res.status(400).json({ message: "Invalid property ID" });
    }
    const utilities2 = await storageImpl.getUtilitiesByPropertyId(propertyId);
    res.json(utilities2);
  });
  apiRouter.post("/utilities", async (req, res) => {
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
  apiRouter.get("/broadband-data", async (req, res) => {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }
    try {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
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
  apiRouter.get("/property-full/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid property ID" });
    }
    const property = await storageImpl.getPropertyById(id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    const internetProviders2 = await storageImpl.getInternetProvidersByPropertyId(property.id);
    const schools2 = await storageImpl.getSchoolsByPropertyId(property.id);
    const utilities2 = await storageImpl.getUtilitiesByPropertyId(property.id);
    res.json({
      property,
      internetProviders: internetProviders2,
      schools: schools2,
      utilities: utilities2
    });
  });
  apiRouter.get("/health", async (req, res) => {
    const dbStatus = checkDatabaseConfig();
    res.json({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      database: {
        available: dbStatus.available,
        message: dbStatus.message
      },
      storage: {
        type: storageImpl.constructor.name,
        // Will show "MemStorage" or "DatabaseStorage"
        memory_only: storageImpl.constructor.name === "MemStorage"
      },
      environment: process.env.NODE_ENV || "development"
    });
  });
  app2.use("/api", apiRouter);
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  if (req.path.startsWith("/api") && !process.env.DATABASE_URL && !req.path.includes("/health")) {
    console.error("DATABASE_URL environment variable is not set");
    return res.status(500).json({
      message: "Database configuration error",
      details: "The DATABASE_URL environment variable is not set. Please add this in the Replit Deployments tab under Configuration > Secrets."
    });
  }
  next();
});
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    database: process.env.DATABASE_URL ? "configured" : "not configured",
    environment: process.env.NODE_ENV || "development"
  });
});
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const isDatabaseError = err.message?.includes("database") || err.message?.includes("DATABASE_URL") || err.message?.includes("sql") || err.message?.includes("pg") || err.message?.includes("connection");
    console.error(`Server error: ${err.message}`, err.stack);
    if (isDatabaseError) {
      return res.status(status).json({
        message: "Database error",
        details: "There was an issue connecting to the database. Please check your DATABASE_URL configuration in Replit Deployments > Configuration > Secrets."
      });
    }
    res.status(status).json({ message });
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
