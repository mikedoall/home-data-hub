import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Home } from 'lucide-react';
import { searchProperties } from '@/lib/api';
import { Property } from '@shared/schema';
import { TypographyH1, TypographyP } from '@/components/ui/typography';

export default function PropertySearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Property[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [, setLocation] = useLocation();

  // Load query parameter on initial render
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      setSearchTerm(q);
      setSearchQuery(q);
    }
  }, []);

  // Perform search when searchQuery changes
  useEffect(() => {
    const performSearch = async () => {
  if (!searchQuery || searchQuery.length < 2) return;

  setIsSearching(true);
  setErrorMessage('');

  try {
    console.log('Searching properties with query:', searchQuery);
    const data = await searchProperties(searchQuery);
    console.log('Raw search results:', data);
    setResults(data);
  } catch (error) {
    console.error('Error searching properties:', error);
    setErrorMessage('Something went wrong. Please try again.');
  } finally {
    setIsSearching(false);
  }
};

  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim().length >= 2) {
      // Update URL with search query
      const url = new URL(window.location.href);
      url.searchParams.set('q', searchTerm);
      window.history.pushState({}, '', url);
      
      setSearchQuery(searchTerm);
    }
  };

  const handlePropertyClick = (propertyId: number) => {
    setLocation(`/property/${propertyId}`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <TypographyH1 className="mb-4">Property Search</TypographyH1>
      <TypographyP className="mb-6">
        Search for any property by address, city, state, or ZIP code to view detailed information.
      </TypographyP>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Enter an address, city, state, or ZIP code"
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
          <p>Searching properties...</p>
        </div>
      ) : (
        <>
          {searchQuery && (
            <div className="mb-4">
              <p className="text-muted-foreground">
                Showing {results.length} results for "{searchQuery}"
              </p>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((property) => (
              <Card 
                key={property.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handlePropertyClick(property.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-start">
                    <Home className="h-5 w-5 mr-2 mt-1 flex-shrink-0 text-primary" />
                    <span className="line-clamp-2">{property.address}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-3">
                    {property.city}, {property.state} {property.zip}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {property.beds && (
                      <div>
                        <div className="text-xs text-muted-foreground">Beds</div>
                        <div className="font-medium">{property.beds}</div>
                      </div>
                    )}
                    {property.baths && (
                      <div>
                        <div className="text-xs text-muted-foreground">Baths</div>
                        <div className="font-medium">{property.baths}</div>
                      </div>
                    )}
                    {property.sqft && (
                      <div>
                        <div className="text-xs text-muted-foreground">Sq.ft</div>
                        <div className="font-medium">{property.sqft.toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                  
                  {property.price && (
                    <div className="mt-2 font-semibold text-lg">
                      ${property.price.toLocaleString()}
                    </div>
                  )}
                  
                  {property.propertyType && (
                    <Badge variant="outline" className="mt-2">
                      {property.propertyType}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
