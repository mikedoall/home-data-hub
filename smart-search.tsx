import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { searchProperties } from "./searchProperties"
import { Property } from "@shared/schema";

const SmartSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Property[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cachedResults, setCachedResults] = useState<Record<string, Property[]>>({});
  const searchRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  const hasResults = searchResults.length > 0;
  const showDropdown = searchTerm.length >= 3 && (hasResults || isLoading || showResults);

  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (searchTerm.length >= 3) {
        setIsLoading(true);
        setShowResults(true);

        if (cachedResults[searchTerm]) {
          setSearchResults(cachedResults[searchTerm]);
        } else {
          try {
            const results = await searchProperties(searchTerm);
            setSearchResults(results);
            setCachedResults(prev => ({ ...prev, [searchTerm]: results }));
          } catch (err) {
            console.error("Search failed:", err);
          }
        }
        setIsLoading(false);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchTerm, cachedResults]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim().length < 3) return;

    if (searchResults.length > 0) {
      setLocation(`/property/${searchResults[0].id}`);
    } else {
      setLocation(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleSelect = (id: number) => {
    setShowResults(false);
    setLocation(`/property/${id}`);
  };

  return (
    <div className="relative max-w-xl mx-auto" ref={searchRef}>
      <form onSubmit={handleSubmit} className="relative">
        <Input
          type="text"
          placeholder="Search by address, city or ZIP"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            if (searchTerm.length >= 3) setShowResults(true);
          }}
          className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300"
        />
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
        <Button
          type="submit"
          className="absolute right-2 top-2 bg-amber-500 hover:bg-amber-600 text-white"
          disabled={searchTerm.trim().length < 3}
        >
          Search
        </Button>
      </form>

      {showDropdown && (
        <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          )}
          {!isLoading && searchResults.length === 0 && (
            <div className="p-4 text-center text-gray-500">No properties found</div>
          )}
          {!isLoading && searchResults.length > 0 && (
            <ul className="divide-y divide-gray-200">
              {searchResults.map((property) => (
                <li
                  key={property.id}
                  className="p-3 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelect(property.id)}
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

export default SmartSearch;
