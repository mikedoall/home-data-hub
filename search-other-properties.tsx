import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useLocation } from "wouter";
import { searchProperties } from "@/lib/api";

const SearchOtherProperties: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [, setLocation] = useLocation();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchTerm.trim().length < 3) return;
    
    // Instead of doing a search here and picking the first result,
    // redirect to the dedicated search page with the query
    setLocation(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <section className="mb-12">
      <div className="bg-primary text-white rounded-xl custom-shadow p-6 md:p-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Want to check another property?</h2>
          <p className="text-primary-light mb-6">Enter any address to get complete household data instantly.</p>
          
          <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
            <Input 
              type="text" 
              placeholder="Enter an address to search" 
              className="w-full px-4 py-3 pl-12 rounded-lg border border-primary-light focus:outline-none focus:ring-2 focus:ring-white text-neutral-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isSearching}
            />
            <Search className="absolute left-3 top-3 text-neutral-500 h-5 w-5" />
            <Button 
              type="submit" 
              className="absolute right-2 top-2 bg-amber-500 hover:bg-amber-600 text-white"
              disabled={isSearching || searchTerm.trim().length < 3}
            >
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default SearchOtherProperties;
