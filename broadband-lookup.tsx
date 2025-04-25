import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, Wifi, WifiOff } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TypographyH1, TypographyH2, TypographyH3, TypographyP } from '@/components/ui/typography';

// Speed formatter with appropriate units
const formatSpeed = (speed: number): string => {
  if (!speed) return 'Unknown';
  if (speed >= 1000) {
    return `${(speed / 1000).toFixed(1)} Gbps`;
  }
  return `${speed} Mbps`;
};

// Function to render a technology badge with appropriate color
const getTechnologyBadgeClass = (tech: string): string => {
  if (tech.includes('Fiber')) {
    return 'bg-green-100 text-green-800';
  } else if (tech.includes('Cable')) {
    return 'bg-blue-100 text-blue-800';
  } else if (tech.includes('Wireless')) {
    return 'bg-yellow-100 text-yellow-800';
  } else if (tech.includes('Satellite')) {
    return 'bg-purple-100 text-purple-800';
  } else if (tech.includes('DSL')) {
    return 'bg-orange-100 text-orange-800';
  }
  return 'bg-gray-200';
};

export default function BroadbandLookup() {
  const [address, setAddress] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Query for broadband data based on address
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['/api/address-broadband', searchTerm],
    queryFn: () => apiRequest(`/api/address-broadband?address=${encodeURIComponent(searchTerm)}`),
    enabled: !!searchTerm,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1
  });
  
  const handleSearch = () => {
    if (address.trim()) {
      setSearchTerm(address.trim());
    }
  };
  
  // Handle enter key in search input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <TypographyH1 className="mb-2">Broadband Availability Lookup</TypographyH1>
      <TypographyP className="mb-6 text-lg">
        Enter your address to check what internet service providers are available in your area.
      </TypographyP>
      
      <div className="flex gap-2 mb-8">
        <Input
          placeholder="Enter your street address, city, state, and zip"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={handleKeyDown}
          className="max-w-xl"
        />
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Search
            </>
          )}
        </Button>
      </div>
      
      {isError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {(error as any)?.message || 'An error occurred while searching. Please try again.'}
          </AlertDescription>
        </Alert>
      )}
      
      {data && data.error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>No Results Found</AlertTitle>
          <AlertDescription>
            {data.message || 'We couldn\'t find any broadband data for the provided address. Please check the address and try again.'}
          </AlertDescription>
        </Alert>
      )}
      
      {data && !data.error && (
        <div>
          <Alert className="mb-4">
            <AlertTitle>Location Information</AlertTitle>
            <AlertDescription>
              <div className="text-sm mt-2">
                <div><strong>Address:</strong> {data.address}</div>
                <div><strong>City:</strong> {data.city}, {data.state} {data.zip}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Coordinates: {data.coordinates.latitude.toFixed(6)}, {data.coordinates.longitude.toFixed(6)}
                </div>
              </div>
            </AlertDescription>
          </Alert>
          
          <TypographyH2 className="mb-4">Available Internet Providers</TypographyH2>
          
          {data.providers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <WifiOff className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <TypographyH3>No providers found</TypographyH3>
                <p className="text-muted-foreground">
                  We couldn't find any internet providers serving this location.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-6 mb-8">
                {data.providers.map((provider: any, index: number) => (
                  <Card className="mb-4" key={`provider-${index}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wifi className="h-5 w-5" />
                        {provider.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm">Available Technologies</h4>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {provider.technologies.map((tech: string, i: number) => (
                              <Badge 
                                key={`${tech}-${i}`} 
                                variant="outline" 
                                className={
                                  tech.includes('Fiber') ? 'bg-green-100 text-green-800' :
                                  tech.includes('Cable') ? 'bg-blue-100 text-blue-800' :
                                  tech.includes('Wireless') ? 'bg-yellow-100 text-yellow-800' :
                                  tech.includes('DSL') ? 'bg-orange-100 text-orange-800' :
                                  'bg-gray-200'
                                }
                              >
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="border rounded-md p-3">
                            <div className="text-sm font-medium">Maximum Speed</div>
                            <div className="mt-1 grid grid-cols-2 gap-2">
                              <div>
                                <div className="text-xs text-muted-foreground">Download</div>
                                <div className="font-semibold">
                                  {formatSpeed(provider.maxDownload)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Upload</div>
                                <div className="font-semibold">
                                  {formatSpeed(provider.maxUpload)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>
                  Data sourced from {data.source || 'FCC Broadband Map'}. Actual availability may vary.
                  Contact providers directly to confirm availability at your specific address.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}