import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { searchProperties } from "@/lib/api";
import { Search } from "lucide-react";
import { Property } from "@shared/schema";

interface SearchBarProps {
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ className }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Property[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const [cachedResults, setCachedResults] = useState<Record<string, Property[]>>({});

  // Use memo to track if results are available to show
  const hasResults = searchResults.length > 0;
  // Force show dropdown when conditions are met
  const showDropdown = searchTerm.length >= 3 && (hasResults || isLoading || showResults);

  // Log visibility state for debugging
  useEffect(() => {
    console.log("Dropdown visibility state updated:", { 
      showResults,
      hasResults,
      isLoading,
      searchTermLength: searchTerm.length,
      showDropdown,
      resultsCount: searchResults.length
    });
  }, [showResults, hasResults, isLoading, searchTerm, showDropdown, searchResults]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (searchTerm.length >= 3) {
        console.log("Search term meets min length, initiating search:", searchTerm);
        setIsLoading(true);
        setShowResults(true);
        
        try {
          console.log("Searching for:", searchTerm);
          // Check cache first
          if (cachedResults[searchTerm]) {
            console.log("Using cached results for:", searchTerm);
            setSearchResults(cachedResults[searchTerm]);
          } else {
            // If not in cache, fetch from API
            console.log("Making API call for:", searchTerm);
            const results = await searchProperties(searchTerm);
            console.log("Search results:", results);
            setSearchResults(results);
            
            // Cache the results
            setCachedResults(prev => ({
              ...prev,
              [searchTerm]: results
            }));
          }
        } catch (error) {
          console.error("Error searching properties:", error);
        } finally {
          setIsLoading(false);
          // Explicitly log the state at the end of the search operation
          console.log("Search completed. Results:", searchResults.length, "Show results state:", showResults);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchTerm, cachedResults, searchResults]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.length >= 3) {
      // Navigate to property page if there's a match
      if (searchResults.length > 0) {
        setLocation(`/property/${searchResults[0].id}`);
      }
    }
  };

  const handleSelectProperty = (propertyId: number) => {
    setShowResults(false);
    setLocation(`/property/${propertyId}`);
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <form onSubmit={handleSearchSubmit} className={className}>
        <div className="relative">
          <Input
            type="text"
            placeholder="Search for an address, city, or ZIP code"
            className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              if (searchTerm.length >= 3) {
                setShowResults(true);
                console.log("Input focused, showing results");
              }
            }}
          />
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
        </div>
      </form>

      {/* Search Results Dropdown */}
      {showDropdown && (
        <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center">
              <div className="text-gray-500">Searching...</div>
            </div>
          )}

          {!isLoading && searchResults.length === 0 && searchTerm.length >= 3 && (
            <div className="p-4 text-center">
              <div className="text-gray-500">No properties found</div>
            </div>
          )}

          {!isLoading && searchResults.length > 0 && (
            <ul className="divide-y divide-gray-200">
              {searchResults.map((property) => (
                <li 
                  key={property.id}
                  className="p-3 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelectProperty(property.id)}
                >
                  <div className="font-medium">{property.address}</div>
                  <div className="text-sm text-gray-500">
                    {property.city}, {property.state} {property.zip}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
