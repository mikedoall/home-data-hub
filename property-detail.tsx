import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getFullPropertyData } from "@/lib/api";
import { Home, Ruler, BedSingle, Bath } from "lucide-react";
import InternetTab from "./internet-tab";
import SchoolsPreview from "./schools-preview";
import UtilitiesPreview from "./utilities-preview";
import InteractiveMap from "./interactive-map";
import { format } from "date-fns";

interface PropertyDetailProps {
  propertyId: number;
}

const PropertyDetail: React.FC<PropertyDetailProps> = ({ propertyId }) => {
  // Type definitions for the property data response
  interface PropertyData {
    property: {
      id: number;
      address: string;
      city: string;
      state: string;
      zip: string;
      propertyType: string;
      sqft?: number;
      beds?: number;
      baths?: number;
      price?: number;
      lastUpdated: string;
      latitude: number;
      longitude: number;
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
    internetProviders: any[];
    schools: any[];
    utilities: any[];
  }

  const { data, isLoading, error } = useQuery<PropertyData>({
    queryKey: [`/api/property-full/${propertyId}`],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const [mapLoaded, setMapLoaded] = useState(false);

  if (isLoading) {
    return <PropertyDetailSkeleton />;
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <h3 className="text-xl font-bold text-red-500 mb-2">Error Loading Property Data</h3>
            <p>We couldn't load the property information. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { property, internetProviders, schools, utilities } = data;
  
  return (
    <section className="mb-12">
      <Card className="bg-white custom-shadow overflow-hidden">
        {/* Property Header */}
        <CardHeader className="p-6 md:p-8 border-b border-neutral-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                {property.address}, {property.city}, {property.state} {property.zip}
              </h2>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Home className="h-3.5 w-3.5" />
                  {property.propertyType}
                </Badge>
                {property.sqft && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Ruler className="h-3.5 w-3.5" />
                    {property.sqft} sq ft
                  </Badge>
                )}
                {property.beds && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <BedSingle className="h-3.5 w-3.5" />
                    {property.beds} beds
                  </Badge>
                )}
                {property.baths && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Bath className="h-3.5 w-3.5" />
                    {property.baths} baths
                  </Badge>
                )}
                {property.broadbandData && property.broadbandData.providers.length > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1 bg-blue-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wifi"><path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 20 0"/><line x1="12" x2="12.01" y1="20" y2="20"/></svg>
                    {property.broadbandData.providers.length} FCC Providers
                  </Badge>
                )}
                {property.censusBlock && (
                  <Badge variant="outline" className="flex items-center gap-1 bg-green-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    Census Block
                  </Badge>
                )}
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex flex-col items-end">
              <div className="text-xl font-bold text-neutral-900">
                ${property.price?.toLocaleString()}
              </div>
              <div className="text-neutral-500 text-sm">
                Last updated: {format(new Date(property.lastUpdated), 'MMM d, yyyy')}
              </div>
            </div>
          </div>
        </CardHeader>
        
        {/* Property Map */}
        <div className="map-container bg-neutral-200 relative" 
             style={{ 
               backgroundImage: `url("https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-l+3498db(${property.longitude},${property.latitude})/${property.longitude},${property.latitude},14,0/800x500?access_token=pk.eyJ1IjoiZGVtby1hY2NvdW50IiwiYSI6ImNscHc1MGp0aDA0ZjUya3FzcnBzbm1jdTcifQ.vy7vFEuOuQqWZiNIa0S2ow")`,
               backgroundSize: 'cover',
               backgroundPosition: 'center',
               height: mapLoaded ? 'auto' : '500px'
             }}>
          {!mapLoaded && (
            <div className="absolute inset-0 bg-neutral-800 bg-opacity-50 flex items-center justify-center">
              <button 
                className="bg-white text-primary font-medium py-3 px-6 rounded-lg shadow-lg hover:bg-neutral-100 transition"
                onClick={() => setMapLoaded(true)}
              >
                Click to Load Interactive Map
              </button>
            </div>
          )}
          {mapLoaded && (
            <InteractiveMap 
              latitude={property.latitude} 
              longitude={property.longitude} 
              address={`${property.address}, ${property.city}, ${property.state} ${property.zip}`} 
            />
          )}
        </div>
        
        {/* Data Tabs */}
        <Tabs defaultValue="internet">
          <TabsList className="border-b border-neutral-200 w-full justify-start overflow-x-auto bg-white p-0 h-auto">
            <TabsTrigger 
              value="internet" 
              className="px-6 py-4 font-medium rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Internet
            </TabsTrigger>
            <TabsTrigger 
              value="schools" 
              className="px-6 py-4 font-medium rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Schools
            </TabsTrigger>
            <TabsTrigger 
              value="utilities" 
              className="px-6 py-4 font-medium rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Utilities
            </TabsTrigger>
            <TabsTrigger 
              value="details" 
              className="px-6 py-4 font-medium rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Property Details
            </TabsTrigger>
            <TabsTrigger 
              value="neighborhood" 
              className="px-6 py-4 font-medium rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Neighborhood
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="internet" className="m-0">
            <InternetTab 
              internetProviders={internetProviders} 
              latitude={property.latitude}
              longitude={property.longitude}
              censusBlock={property.censusBlock}
              broadbandData={property.broadbandData}
            />
          </TabsContent>
          
          <TabsContent value="schools" className="m-0 p-6 md:p-8">
            <SchoolsPreview schools={schools} isPreview={false} />
          </TabsContent>
          
          <TabsContent value="utilities" className="m-0 p-6 md:p-8">
            <UtilitiesPreview utilities={utilities} isPreview={false} />
          </TabsContent>
          
          <TabsContent value="details" className="m-0 p-6 md:p-8">
            <h3 className="text-xl font-bold text-neutral-900 mb-4">Property Details</h3>
            <p className="text-neutral-700">Detailed property information will appear here.</p>
          </TabsContent>
          
          <TabsContent value="neighborhood" className="m-0 p-6 md:p-8">
            <h3 className="text-xl font-bold text-neutral-900 mb-4">Neighborhood Information</h3>
            <p className="text-neutral-700">Neighborhood details will appear here.</p>
          </TabsContent>
        </Tabs>
      </Card>
    </section>
  );
};

const PropertyDetailSkeleton: React.FC = () => {
  return (
    <Card className="bg-white custom-shadow overflow-hidden mb-12">
      <CardHeader className="p-6 md:p-8 border-b border-neutral-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="w-full">
            <Skeleton className="h-8 w-2/3 mb-4" />
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <div className="h-[300px] bg-neutral-100" />
      
      <div className="border-b border-neutral-200 p-4">
        <Skeleton className="h-10 w-full" />
      </div>
      
      <div className="p-6 md:p-8">
        <Skeleton className="h-8 w-1/3 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </Card>
  );
};

export default PropertyDetail;
