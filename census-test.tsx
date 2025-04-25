import React, { useState } from 'react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, MapPin, Wifi } from 'lucide-react';

export default function CensusTestPage() {
  const { toast } = useToast();
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState({
    latitude: '',
    longitude: ''
  });
  const [queryType, setQueryType] = useState<'address' | 'coordinates'>('address');
  const [isLoading, setIsLoading] = useState(false);
  const [broadbandData, setBroadbandData] = useState<any>(null);

  const handleAddressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address) {
      toast({ 
        title: 'Address Required',
        description: 'Please enter an address to search',
        variant: 'destructive'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call our new endpoint
      const response = await fetch(`/api/fcc-broadband?address=${encodeURIComponent(address)}`);
      const data = await response.json();
      
      setBroadbandData(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch broadband data for this address',
        variant: 'destructive'
      });
      console.error('Broadband search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoordinateSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!coordinates.latitude || !coordinates.longitude) {
      toast({ 
        title: 'Coordinates Required',
        description: 'Please enter both latitude and longitude',
        variant: 'destructive'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call our new endpoint
      const response = await fetch(`/api/fcc-broadband?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}`);
      const data = await response.json();
      
      setBroadbandData(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch broadband data for these coordinates',
        variant: 'destructive'
      });
      console.error('Broadband search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Census-Based Broadband Lookup</h1>
      <p className="mb-6 text-muted-foreground">
        This page demonstrates the new census-based broadband lookup capabilities. 
        Enter an address or coordinates to retrieve broadband availability information 
        with Census block data.
      </p>
      
      <Card>
        <CardHeader>
          <CardTitle>Broadband Availability Search</CardTitle>
          <CardDescription>
            Search for broadband providers by address or coordinates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={queryType} onValueChange={(v) => setQueryType(v as 'address' | 'coordinates')}>
            <TabsList className="mb-4">
              <TabsTrigger value="address" className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Address
              </TabsTrigger>
              <TabsTrigger value="coordinates" className="flex items-center gap-1">
                <Wifi className="h-4 w-4" />
                Coordinates
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="address">
              <form onSubmit={handleAddressSearch}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="Enter full address (e.g. 1600 Pennsylvania Ave, Washington DC)"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      'Search'
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="coordinates">
              <form onSubmit={handleCoordinateSearch}>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        placeholder="33.749"
                        value={coordinates.latitude}
                        onChange={(e) => setCoordinates({...coordinates, latitude: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        placeholder="-84.388"
                        value={coordinates.longitude}
                        onChange={(e) => setCoordinates({...coordinates, longitude: e.target.value})}
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      'Search'
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {broadbandData && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>
                {broadbandData.success ? 'Broadband Results' : 'Error'}
              </CardTitle>
              <CardDescription>
                {broadbandData.message || (broadbandData.error && `Error: ${broadbandData.error}`)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Census Block Info */}
                {broadbandData.censusBlock && (
                  <div className="bg-muted p-4 rounded-md">
                    <h3 className="text-lg font-semibold mb-2">Census Block Information</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Block Code:</span>{' '}
                        {broadbandData.censusBlock.blockcode}
                      </div>
                      <div>
                        <span className="font-medium">State/County:</span>{' '}
                        {broadbandData.censusBlock.state}/{broadbandData.censusBlock.county}
                      </div>
                      <div>
                        <span className="font-medium">Latitude:</span>{' '}
                        {broadbandData.censusBlock.latitude}
                      </div>
                      <div>
                        <span className="font-medium">Longitude:</span>{' '}
                        {broadbandData.censusBlock.longitude}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Provider List */}
                {broadbandData.providers && broadbandData.providers.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Available Providers ({broadbandData.count})
                    </h3>
                    <div className="space-y-4">
                      {broadbandData.providers.map((provider: any, index: number) => (
                        <div key={index} className="border rounded-md p-4">
                          <h4 className="text-base font-semibold">
                            {provider.name}
                            {provider.dbaName && provider.dbaName !== provider.name && 
                              ` (${provider.dbaName})`}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {provider.type || 'Internet Provider'}
                            {provider.holdingCompany && ` • ${provider.holdingCompany}`}
                          </p>
                          
                          <h5 className="text-sm font-medium mt-3 mb-1">Available Technologies</h5>
                          <div className="grid gap-2">
                            {provider.technologies.map((tech: any, techIndex: number) => (
                              <div key={techIndex} className="bg-muted p-2 rounded-md text-sm">
                                <div className="font-medium">{tech.type}</div>
                                <div className="grid grid-cols-2 gap-x-4 mt-1 text-xs text-muted-foreground">
                                  <div>Max Download: {tech.maxDownloadSpeed} Mbps</div>
                                  <div>Max Upload: {tech.maxUploadSpeed} Mbps</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 bg-muted rounded-md">
                    <p className="text-muted-foreground">
                      {broadbandData.success
                        ? 'No providers found for this location.'
                        : 'Error retrieving provider information.'}
                    </p>
                  </div>
                )}
                
                {/* Response Source */}
                <div className="mt-4 text-xs text-muted-foreground">
                  Source: {broadbandData.source || 'Unknown'} • 
                  Data fetched at {new Date().toLocaleTimeString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}