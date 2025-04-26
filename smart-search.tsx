import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { searchProperties } from "../searchProperties";
import { Property } from "@/shared/schema";

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
            setCachedResults((prev) => ({ ...prev, [searchTerm]: results }));
          } catch (error) {
            console.error("Error searching properties:", error);
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
    <div className="relative w-full max-w-lg mx-auto" ref={searchRef}>
      <form onSubmit={handleSubmit} className="flex items-center border rounded px-3 py-2">
        <Search className="text-gray-500 mr-2" size={20} />
        <input
          type="text"
          placeholder="Search by address, city, state, or ZIP"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full outline-none"
        />
      </form>

      {showDropdown && (
        <div className="absolute left-0 right-0 bg-white border border-gray-300 rounded-md mt-2 w-full z-50">
          {searchResults.map((property) => (
            <div
              key={property.id}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(property.id)}
            >
              {property.address}, {property.city}, {property.state} {property.zip}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartSearch;
