import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InternetProvider } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import BroadbandAvailability from "./broadband-availability";

interface InternetTabProps {
  internetProviders: InternetProvider[];
  latitude?: number;
  longitude?: number;
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
}

const InternetTab: React.FC<InternetTabProps> = ({ 
  internetProviders, 
  latitude = 34.0522,   // Default to Los Angeles if not provided
  longitude = -118.2437,
  censusBlock,
  broadbandData
}) => {

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h3 className="text-xl font-bold text-neutral-900 mb-4">Internet Providers Available</h3>
        <p className="text-neutral-700 mb-6">
          This property has access to <span className="font-semibold">{internetProviders.length} internet providers</span> with speeds up to <span className="font-semibold">
            {Math.max(...internetProviders.map(p => p.maxDownload))} Mbps
          </span>.
        </p>
        
        {/* Internet Provider Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {internetProviders.map((provider) => (
            <Card key={provider.id} className="hover:shadow-lg transition">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="font-bold text-lg">{provider.name}</div>
                  <Badge variant={provider.isAvailable ? "default" : "destructive"} className={provider.isAvailable ? "bg-green-500 hover:bg-green-600 text-white" : ""}>
                    {provider.isAvailable ? "Available" : "Unavailable"}
                  </Badge>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Max Download</span>
                    <span className="font-medium">{formatSpeed(provider.maxDownload)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Max Upload</span>
                    <span className="font-medium">{formatSpeed(provider.maxUpload)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Connection Type</span>
                    <span className="font-medium">{provider.technology}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Starting Price</span>
                    <span className="font-medium">${provider.startingPrice}/mo</span>
                  </div>
                </div>
                
                <Button className="w-full" variant="default">
                  View Plans
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Internet Speed Comparison */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-neutral-900 mb-4">Speed Comparison</h3>
        
        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-neutral-100">
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Technology</TableHead>
                  <TableHead>Download Speed</TableHead>
                  <TableHead>Upload Speed</TableHead>
                  <TableHead>Starting Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {internetProviders.map((provider) => {
                  const maxDownload = Math.max(...internetProviders.map(p => p.maxDownload));
                  const maxUpload = Math.max(...internetProviders.map(p => p.maxUpload));
                  
                  const downloadPercent = (provider.maxDownload / maxDownload) * 100;
                  const uploadPercent = (provider.maxUpload / maxUpload) * 100;
                  
                  return (
                    <TableRow key={provider.id}>
                      <TableCell className="font-medium">{provider.name}</TableCell>
                      <TableCell>{provider.technology}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-32 mr-2">
                            <Progress value={downloadPercent} className="h-2.5" />
                          </div>
                          <span>{formatSpeed(provider.maxDownload)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-32 mr-2">
                            <Progress value={uploadPercent} className="h-2.5" />
                          </div>
                          <span>{formatSpeed(provider.maxUpload)}</span>
                        </div>
                      </TableCell>
                      <TableCell>${provider.startingPrice}/mo</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      
      {/* FCC Broadband Map Data */}
      {broadbandData && broadbandData.providers.length > 0 ? (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-neutral-900 mb-4">FCC Broadband Providers</h3>
          
          {censusBlock && (
            <div className="bg-green-50 p-4 rounded-lg mb-4 border border-green-200">
              <div className="flex items-center gap-2 font-medium text-green-800 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                Census Block Information
              </div>
              <div className="text-sm text-green-800">
                <p><span className="font-semibold">GEOID:</span> {censusBlock.geoid}</p>
                <p><span className="font-semibold">State:</span> {censusBlock.state}, <span className="font-semibold">County:</span> {censusBlock.county}</p>
                <p><span className="font-semibold">Tract:</span> {censusBlock.tract}, <span className="font-semibold">Block:</span> {censusBlock.block}</p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {broadbandData.providers.map((provider, index) => (
              <Card key={index} className="hover:shadow-sm transition bg-blue-50/30">
                <CardContent className="p-4">
                  <div className="font-bold text-lg mb-2">{provider.name}</div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {provider.technologies.map((tech, i) => (
                      <Badge key={i} variant="outline">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                      <span className="font-medium">{formatSpeed(provider.maxDownload)} Down</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                      <span className="font-medium">{formatSpeed(provider.maxUpload)} Up</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>
              Data source: {broadbandData.source}
            </div>
            {broadbandData.message && (
              <p className="mt-1">{broadbandData.message}</p>
            )}
          </div>
        </div>
      ) : (
        <BroadbandAvailability 
          latitude={latitude} 
          longitude={longitude} 
        />
      )}
    </div>
  );
};

// Helper function to format speeds properly
function formatSpeed(speed: number): string {
  return speed >= 1000 ? `${speed / 1000} Gbps` : `${speed} Mbps`;
}

export default InternetTab;
