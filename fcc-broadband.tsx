import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TypographyH1, TypographyP } from '@/components/ui/typography';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Wifi, WifiOff } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define the data structure for broadband providers
interface Provider {
  name: string;
  technologies: string[];
  maxDownload: number;
  maxUpload: number;
  source: string;
}

// Define the data structure for the broadband data response
interface BroadbandData {
  providers: Provider[];
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  geocoded?: boolean;
  message?: string;
  error?: string;
  success?: boolean;
  region?: string;
  regionName?: string;
  source?: string;
  fromFCC?: boolean;
}

export default function FccBroadband() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [broadbandData, setBroadbandData] = useState<BroadbandData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [, setLocation] = useLocation();
  
  // Get the search query from URL if present
  const queryParams = new URLSearchParams(window.location.search);
  const urlQuery = queryParams.get('address');
  
  React.useEffect(() => {
    if (urlQuery) {
      setSearchTerm(urlQuery);
      performSearch(urlQuery);
    }
    
    // Log to confirm this component is being rendered
    console.log('FCC Broadband component mounted - this is the FCC page at /fcc-broadband');
  }, []);
  
  const performSearch = async (address: string) => {
    if (!address || address.length < 2) return;
    
    console.log('Searching broadband data for address:', address);
    
    setIsSearching(true);
    setErrorMessage('');
    setBroadbandData(null);
    
    try {
      console.log('Making request to /api/address-broadband with address:', address);
      // Make direct API request to the address-broadband endpoint
      const response = await fetch(`/api/address-broadband?address=${encodeURIComponent(address)}`);
      console.log('API response status:', response.status);
      
      // For debugging - the actual structure from the API
      const responseClone = response.clone();
      const rawResponseBody = await responseClone.text();
      console.log('RAW API RESPONSE BODY (address-broadband endpoint):', rawResponseBody);
      
      // Add visual debug message to the console for easier troubleshooting
      console.log('');
      console.log('=======================DEBUG INFO=======================');
      console.log('Endpoint: /api/address-broadband');
      console.log('Address queried:', address);
      console.log('Response status:', response.status);
      console.log('Response text length:', rawResponseBody.length);
      console.log('=====================END DEBUG INFO====================');
      console.log('');
      
      let data;
      try {
        data = JSON.parse(rawResponseBody);
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        throw new Error('Invalid API response format');
      }
      console.log('Broadband data response:', data);
      
      // Check for error responses
      if (data.error === true || data.success === false || response.status !== 200) {
        console.error('API returned error:', data);
        throw new Error(data.message || 'Failed to find broadband data for this address');
      }
      
      // Check if we have the expected structure
      if (!data.providers || !Array.isArray(data.providers)) {
        console.error('API response missing providers array:', data);
        
        // If we have geocoded address data but no providers, create a proper structure
        if (data.latitude && data.longitude) {
          console.log('Creating broadband data structure from geocoded address');
          const broadbandData = {
            providers: [],
            address: data.address || address,
            city: data.city || '',
            state: data.state || '',
            zip: data.zip || '',
            geocoded: true,
            message: 'No broadband providers found at this location.'
          };
          setBroadbandData(broadbandData);
          return;
        } else {
          throw new Error('No broadband providers found at this address');
        }
      }
      
      // Set the broadband data in state
      console.log('Setting broadband data (should have providers array):', data);
      
      // The response is now directly in the format our UI expects:
      // {
      //   providers: [...],
      //   address: "...",
      //   city: "...",
      //   state: "...",
      //   zip: "...",
      //   message: "..."
      // }
      setBroadbandData(data);
    } catch (error) {
      console.error('Error searching broadband data:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchTerm.trim().length < 2) return;
    
    // Update URL with search query
    const url = new URL(window.location.href);
    url.searchParams.set('address', searchTerm);
    window.history.pushState({}, '', url);
    
    performSearch(searchTerm);
  };
  
  // Function to format speed in Mbps
  const formatSpeed = (speed: number) => {
    if (speed >= 1000) {
      return `${(speed / 1000).toFixed(1)} Gbps`;
    }
    return `${speed} Mbps`;
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <TypographyH1 className="mb-4">FCC Broadband Search</TypographyH1>
      <TypographyP className="mb-6">
        Enter any address to check available internet providers and speeds using FCC broadband data.
      </TypographyP>
      
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Enter an address (e.g. 123 Main St, New York, NY)"
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isSearching}
            />
          </div>
          <Button type="submit" disabled={isSearching || searchTerm.trim().length < 2}>
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching
              </>
            ) : (
              'Search'
            )}
          </Button>
        </div>
      </form>
      
      {errorMessage && (
        <div className="mb-8 p-4 bg-destructive/10 text-destructive rounded-md">
          {errorMessage}
        </div>
      )}
      
      {isSearching ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <p>Searching for broadband data...</p>
        </div>
      ) : (
        <>
          {broadbandData && (
            <div className="mt-8">
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Location Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium">{broadbandData.address}</p>
                  <p className="text-muted-foreground">
                    {broadbandData.city}, {broadbandData.state} {broadbandData.zip}
                  </p>
                </CardContent>
              </Card>
              
              <TypographyH1 className="text-xl font-bold mb-4">
                Internet Providers
              </TypographyH1>
              
              {broadbandData.providers && broadbandData.providers.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {broadbandData.providers.map((provider, index) => (
                    <Card key={`${provider.name}-${index}`} className="overflow-hidden">
                      <CardHeader className="bg-primary/5 pb-2">
                        <CardTitle className="flex items-center gap-2">
                          <Wifi className="h-5 w-5 text-primary" />
                          <span>{provider.name}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div>
                            <div className="text-xs text-muted-foreground">Download</div>
                            <div className="font-medium">{formatSpeed(provider.maxDownload)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Upload</div>
                            <div className="font-medium">{formatSpeed(provider.maxUpload)}</div>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <div className="text-xs text-muted-foreground mb-1">Technologies</div>
                          <div className="flex flex-wrap gap-1">
                            {provider.technologies.map((tech, techIdx) => (
                              <Badge key={techIdx} variant="secondary">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mt-3 text-xs text-muted-foreground">
                          Source: {provider.source}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-muted rounded-lg flex flex-col items-center">
                  <WifiOff className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No internet providers found</p>
                  <p className="text-muted-foreground">
                    We couldn't find any internet providers at this location based on FCC data.
                  </p>
                </div>
              )}
              
              {/* Show a more prominent notice when using regional data */}
              {broadbandData.region && !broadbandData.fromFCC && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-amber-800">
                        Using Regional Data
                      </h3>
                      <div className="mt-1 text-sm text-amber-700">
                        <p>
                          The FCC API returned regional data for the {broadbandData.regionName || "area"} instead of specific 
                          data for this address. The providers shown represent those commonly available in this region.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Default message */}
              {broadbandData.message && (
                <div className="mt-4 p-4 bg-primary/5 rounded-md">
                  <p className="text-sm">{broadbandData.message}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}