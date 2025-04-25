import { pgTable, text, serial, integer, boolean, varchar, decimal, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

// Property schema
export const properties = pgTable("properties", {
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
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  lastUpdated: true,
});

// Internet Provider schema
export const internetProviders = pgTable("internet_providers", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  name: text("name").notNull(),
  technology: text("technology").notNull(),
  maxDownload: integer("max_download").notNull(),
  maxUpload: integer("max_upload").notNull(),
  startingPrice: decimal("starting_price", { precision: 6, scale: 2 }),
  isAvailable: boolean("is_available").default(true),
});

export const insertInternetProviderSchema = createInsertSchema(internetProviders).omit({
  id: true,
});

// School schema
export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // Elementary, Middle, High
  address: text("address"),
  district: text("district"),
  rating: integer("rating"),
  studentTeacherRatio: text("student_teacher_ratio"),
});

export const insertSchoolSchema = createInsertSchema(schools).omit({
  id: true,
});

// Utility schema
export const utilities = pgTable("utilities", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  type: text("type").notNull(), // Electricity, Water, Gas, Trash
  provider: text("provider").notNull(),
  estimatedCostMin: integer("estimated_cost_min"),
  estimatedCostMax: integer("estimated_cost_max"),
  additionalInfo: text("additional_info"),
});

export const insertUtilitySchema = createInsertSchema(utilities).omit({
  id: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type InternetProvider = typeof internetProviders.$inferSelect;
export type InsertInternetProvider = z.infer<typeof insertInternetProviderSchema>;

export type School = typeof schools.$inferSelect;
export type InsertSchool = z.infer<typeof insertSchoolSchema>;

export type Utility = typeof utilities.$inferSelect;
export type InsertUtility = z.infer<typeof insertUtilitySchema>;

// FCC Broadband Availability Data
export const broadbandProviders = pgTable("broadband_providers", {
  id: serial("id").primaryKey(),
  providerName: text("provider_name").notNull(),
  providerDbaName: text("provider_dba_name"),
  frn: text("frn").notNull(), // FCC Registration Number
  holdingCompanyName: text("holding_company_name"),
  holdingCompanyFinal: text("holding_company_final"),
  providerType: text("provider_type"),
  dataAsOf: text("data_as_of").notNull(), // version of the data, e.g., "jun2024"
});

export const insertBroadbandProviderSchema = createInsertSchema(broadbandProviders).omit({
  id: true,
});

export const broadbandAvailability = pgTable("broadband_availability", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").references(() => broadbandProviders.id).notNull(),
  frn: text("frn").notNull(), // FCC Registration Number (for direct linking without join)
  technologyCode: text("technology_code").notNull(),
  technologyName: text("technology_name").notNull(),
  maxDownload: integer("max_download").notNull(),
  maxUpload: integer("max_upload").notNull(),
  blockId: text("block_id").notNull(), // Census block ID
  stateAbbr: text("state_abbr").notNull(),
  county: text("county").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  dataAsOf: text("data_as_of").notNull(), // version of the data, e.g., "jun2024"
});

export const insertBroadbandAvailabilitySchema = createInsertSchema(broadbandAvailability).omit({
  id: true,
});

export type BroadbandProvider = typeof broadbandProviders.$inferSelect;
export type InsertBroadbandProvider = z.infer<typeof insertBroadbandProviderSchema>;
export type BroadbandAvailability = typeof broadbandAvailability.$inferSelect;
export type InsertBroadbandAvailability = z.infer<typeof insertBroadbandAvailabilitySchema>;

// FCC Cache table for storing FCC Broadband data by Census block ID
export const fccCache = pgTable("fcc_cache", {
  id: serial("id").primaryKey(),
  geoid: text("geoid").notNull().unique(), // Census block ID (GEOID)
  broadbandData: text("broadband_data").notNull(), // JSON string of broadband data
  lastFetched: timestamp("last_fetched").defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiration time
});

export const insertFccCacheSchema = createInsertSchema(fccCache).omit({
  id: true,
  lastFetched: true,
});

export type FccCache = typeof fccCache.$inferSelect;
export type InsertFccCache = z.infer<typeof insertFccCacheSchema>;
