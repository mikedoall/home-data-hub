import SmartSearch from "./smart-search";
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TypographyH1, TypographyP } from '@/components/ui/typography';
import { Badge } from '@/components/ui/badge';
import { Home, Search, Loader2, MapPin } from 'lucide-react';
import debounce from 'lodash.debounce';

// Define the property type based on our schema
interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude?: number;
  longitude?: number;
  propertyType?: string;
  sqft?: number;
  beds?: number;
  baths?: number;
  price?: number;
  lastUpdated?: string;
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

// Define a type for address suggestions
interface AddressSuggestion {
  formatted: string;
  components: {
    road?: string;
    house_number?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  geometry: {
    lat: number;
    lng: number;
  };
}

export default function PropertySearchNew() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Property[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();
  
  // Get the search query from URL if present
  const queryParams = new URLSearchParams(window.location.search);
  const urlQuery = queryParams.get('q');
  
  // Function to fetch address suggestions
  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }
    
    setIsLoadingSuggestions(true);
    console.log('Fetching autocomplete suggestions for:', query);
    
    try {
      const url = `/api/autocomplete?q=${encodeURIComponent(query)}`;
      console.log('Autocomplete API URL:', url);
      
      const response = await fetch(url);
      console.log('Autocomplete API response status:', response.status);
      
      if (!response.ok) {
        console.error(`API error: ${response.status} ${response.statusText}`);
        setSuggestions([]);
        return;
      }
      
      // Log raw response for debugging
      const responseText = await response.text();
      console.log('Autocomplete API raw response:', responseText);
      
      try {
        // Parse the JSON (now that we've logged the raw text)
        const data = responseText ? JSON.parse(responseText) : null;
        console.log('Autocomplete API parsed data:', data);
        
        if (data && data.success === true && Array.isArray(data.results)) {
          console.log('Found suggestions:', data.results.length);
          
          // Ensure each suggestion has the correct format
          const formattedSuggestions = data.results.map((result: any) => {
            // Make sure we have the formatted property as expected by our component
            if (!result.formatted && result.formatted_address) {
              result.formatted = result.formatted_address;
            }
            
            // Ensure we have a components property even if empty
            if (!result.components) {
              result.components = {};
            }
            
            // Ensure we have a geometry property
            if (!result.geometry && result.lat && result.lng) {
              result.geometry = { lat: result.lat, lng: result.lng };
            } else if (!result.geometry) {
              result.geometry = { lat: 0, lng: 0 };
            }
            
            return result;
          });
          
          console.log('DEBUG: About to apply suggestions. Current states:', { 
            showSuggestions, 
            isLoadingSuggestions, 
            suggestionsCount: formattedSuggestions.length 
          });
          
          // Apply the suggestions to state
          console.log("DIRECT CHECK - Suggestions before setting state:", suggestions);
          setSuggestions(formattedSuggestions);
          setShowSuggestions(true);
          console.log("DIRECT CHECK - Suggestions data being applied:", formattedSuggestions);
          
          // Verify the state was set correctly
          setTimeout(() => {
            console.log('DEBUG VERIFY: After state update:', {
              suggestionsLength: formattedSuggestions.length,
              showSuggestions: true,
              firstSuggestion: formattedSuggestions.length > 0 ? formattedSuggestions[0].formatted : 'none'
            });
          }, 10);
        } else {
          console.log('No valid suggestions in response');
          setSuggestions([]);
        }
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setSuggestions([]);
    } finally {
      // Keep suggestions visible, just turn off the loading state
      console.log('DEBUG: Setting isLoadingSuggestions to FALSE but keeping showSuggestions as is');
      setIsLoadingSuggestions(false);
      
      // Force re-check of state to see if dropdown is actually showing
      setTimeout(() => {
        console.log('DEBUG: Final check of dropdown state:', {
          showSuggestions,
          isLoadingSuggestions: false,
          suggestions: suggestions.length
        });
      }, 50);
    }
  };
  
  // Create debounced version of fetchSuggestions
  const debouncedFetchSuggestions = useRef(
    debounce((query: string) => {
      console.log('Debounced function actually executing with query:', query);
      fetchSuggestions(query);
    }, 300)
  ).current;
  
  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setSearchTerm(suggestion.formatted);
    setShowSuggestions(false);
    
    // Update URL and perform search
    const url = new URL(window.location.href);
    url.searchParams.set('q', suggestion.formatted);
    window.history.pushState({}, '', url);
    
    performSearch(suggestion.formatted);
  };
  
  // Hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  useEffect(() => {
    if (urlQuery) {
      setSearchTerm(urlQuery);
      performSearch(urlQuery);
    }
  }, []);
  
  const performSearch = async (query: string) => {
    if (!query || query.length < 2) return;
    
    console.log('performSearch function called');
    console.log('Search query:', query);
    
    setIsSearching(true);
    setErrorMessage('');
    
    try {
      // Make direct API request with fetch
      const response = await fetch(`/api/properties/search?q=${encodeURIComponent(query)}`);
      console.log('API response status:', response.status);
      
      const data = await response.json();
      console.log('API search results:', data);
      
      // Process the response properly
      let searchResults: Property[] = [];
      
      if (data && data.success === true && Array.isArray(data.results)) {
        // New API format with geocoded results
        console.log('FOUND GEOCODED RESULTS:', data.results.length);
        searchResults = data.results;
        
        // Display custom message if provided by API
        if (data.message && data.results.length > 0 && searchResults[0].propertyType === "Address") {
          setErrorMessage(data.message);
        }
      } else if (Array.isArray(data)) {
        // Old API format (direct array)
        console.log('FOUND DIRECT ARRAY RESULTS:', data.length);
        searchResults = data;
      } else {
        console.warn('Unknown API response format:', data);
      }
      
      console.log('FINAL PROCESSED RESULTS:', searchResults);
      
      // If we have results, use them directly with no extra conditions
      if (searchResults && searchResults.length > 0) {
        console.log('Setting results state with:', searchResults.length, 'properties');
        setResults(searchResults);
      } else {
        console.log('No results found, setting error message');
        if (data && data.message) {
          setErrorMessage(data.message);
        } else {
          setErrorMessage('No properties found matching your search criteria');
        }
      }
    } catch (error) {
      console.error('Error searching properties:', error);
      setErrorMessage('An error occurred while searching. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchTerm.trim().length < 2) return;
    
    // Update URL with search query
    const url = new URL(window.location.href);
    url.searchParams.set('q', searchTerm);
    window.history.pushState({}, '', url);
    
    performSearch(searchTerm);
  };
  
  const handlePropertyClick = (propertyId: number) => {
    setLocation(`/property/${propertyId}`);
  };
  
  // Simple test function to directly test the autocomplete API
  const testAutocompleteAPI = async () => {
    try {
      // Get a random test query that will likely have results
      const testQueries = ["Rochester", "New York", "Dallas", "Los Angeles", "39 Windwood"];
      const testQuery = testQueries[Math.floor(Math.random() * testQueries.length)];
      
      console.log('TEST: Making direct request to autocomplete API with query:', testQuery);
      const response = await fetch(`/api/autocomplete?q=${encodeURIComponent(testQuery)}`);
      console.log('TEST: API response status:', response.status);
      
      const responseText = await response.text();
      console.log('TEST: Raw response:', responseText);
      
      try {
        const data = JSON.parse(responseText);
        console.log('TEST: Parsed JSON data:', data);
        
        if (data && data.success && Array.isArray(data.results)) {
          console.log('TEST: Success! Found', data.results.length, 'suggestions');
          
          // Test our suggestion formatter
          console.log('TEST: Applying our formatter to suggestions...');
          const formattedSuggestions = data.results.map((result: any) => {
            // Make sure we have the formatted property
            if (!result.formatted && result.formatted_address) {
              result.formatted = result.formatted_address;
            }
            
            // Ensure we have a components property even if empty
            if (!result.components) {
              result.components = {};
            }
            
            // Ensure we have a geometry property
            if (!result.geometry && result.lat && result.lng) {
              result.geometry = { lat: result.lat, lng: result.lng };
            } else if (!result.geometry) {
              result.geometry = { lat: 0, lng: 0 };
            }
            
            return result;
          });
          
          console.log('TEST: Formatted suggestions:', formattedSuggestions);
          
          // Force the suggestions to be visible by directly modifying the DOM
          const testSuggestions = document.getElementById('test-suggestions');
          if (testSuggestions) {
            testSuggestions.innerHTML = `
              <div class="py-1">
                ${formattedSuggestions.map((s, i) => `
                  <div class="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-start">
                    <span class="text-sm">${s.formatted}</span>
                  </div>
                `).join('')}
              </div>
            `;
          }
          
          // Actually set the suggestions to see if the UI works
          setSuggestions(formattedSuggestions);
          setShowSuggestions(true);
          setIsLoadingSuggestions(false);
        } else {
          console.log('TEST: No valid results in response');
        }
      } catch (parseError) {
        console.error('TEST: Failed to parse response as JSON:', parseError);
      }
    } catch (error) {
      console.error('TEST: Error testing autocomplete API:', error);
    }
  };

  // Add explicit logging of suggestions on every render
  console.log('RENDER LOG - Current suggestions:', { 
    count: suggestions.length, 
    suggestions,
    showSuggestions,
    isLoadingSuggestions
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <TypographyH1 className="mb-4">Property Search</TypographyH1>
      <TypographyP className="mb-6">
        Search for any property by address, city, state, or ZIP code to view detailed information.
      </TypographyP>
      <TypographyP className="mb-6">
  Search for any property by address, city, state, or ZIP code to view detailed information.
</TypographyP>

<SmartSearch />  {/* ✅ Add this line here! */}

{/* Debug test button */}

      {/* Debug test button */}
      <div className="bg-gray-100 p-3 mb-4 rounded-md">
        <div className="text-sm font-medium mb-2">Autocomplete API Debug</div>
        <button 
          onClick={testAutocompleteAPI}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
        >
          Test Autocomplete API
        </button>
        <div className="text-xs mt-2 text-gray-500">Check console for results</div>
        
        {/* Test suggestions container - direct DOM access */}
        <div id="test-suggestions" className="mt-4 border border-blue-200 p-2 rounded bg-white"></div>
      </div>
      
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-muted-foreground h-5 w-5" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Enter an address, city, state, or ZIP code"
              className="pl-10"
              value={searchTerm}
              onChange={(e) => {
                const value = e.target.value;
                console.log('Input changed:', value);
                setSearchTerm(value);
                if (value.length >= 3) {
                  console.log('Calling debounced function with:', value);
                  debouncedFetchSuggestions(value);
                  setIsLoadingSuggestions(true);
                  setShowSuggestions(true);
                  console.log('Set loading to TRUE, showSuggestions to TRUE');
                } else {
                  console.log('Input too short for suggestions');
                  setSuggestions([]);
                  setShowSuggestions(false);
                }
              }}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              disabled={isSearching}
            />
            
            {/* Autocomplete suggestions dropdown */}
            {/* TEMPORARILY Force always visible for debugging */}
            <div 
              ref={suggestionsRef}
              className={`absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto block`}
            >
              {isLoadingSuggestions ? (
                <div className="p-2 text-center">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
                  <span className="text-sm text-muted-foreground">Loading suggestions...</span>
                </div>
              ) : suggestions.length > 0 ? (
                <div className="py-1">
                  {suggestions.map((suggestion, index) => {
                    console.log('MAPPING SUGGESTION:', index, suggestion);
                    return (
                      <div
                        key={index}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-start"
                        onClick={() => handleSelectSuggestion(suggestion)}
                      >
                        <MapPin className="h-4 w-4 mr-2 mt-1 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm">{suggestion.formatted}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  No matching addresses found
                </div>
              )}
            </div>
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
          {searchTerm && (
            <div className="mb-4">
              <p className="text-muted-foreground">
                Showing {results.length} results for "{searchTerm}"
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
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {property.propertyType && (
                      <Badge>
                        {property.propertyType}
                      </Badge>
                    )}
                    {property.broadbandData?.providers && property.broadbandData.providers.length > 0 && (
                      <Badge variant="outline" className="flex items-center gap-1 bg-blue-50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wifi"><path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 20 0"/><line x1="12" x2="12.01" y1="20" y2="20"/></svg>
                        {property.broadbandData.providers.length} Providers
                      </Badge>
                    )}
                    {property.censusBlock && (
                      <Badge variant="outline" className="flex items-center gap-1 bg-green-50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        Census Block {property.censusBlock.block}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
