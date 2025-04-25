import React, { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import SearchBar from "./search-bar";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Simple toggle for mobile menu
  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        {/* Top Row with Logo and Mobile Menu */}
        <div className="flex justify-between items-center mb-4 md:mb-0">
          <div>
            <Link href="/">
              <span className="text-blue-600 font-bold text-2xl cursor-pointer">HomeDataHub</span>
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
        
        {/* Middle Row with Search Bar */}
        <div className="mb-4 md:hidden">
          <SearchBar />
        </div>
        
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between">
          <div className="w-2/3">
            <SearchBar />
          </div>
          
          {/* Desktop Navigation */}
          <nav className="flex items-center space-x-4 ml-6">
            <Link href="/search">
              <span className="text-gray-700 hover:text-blue-600 font-medium cursor-pointer">Property Search</span>
            </Link>
            <Link href="/broadband">
              <span className="text-gray-700 hover:text-blue-600 font-medium cursor-pointer">Broadband</span>
            </Link>
            <Link href="/about">
              <span className="text-gray-700 hover:text-blue-600 font-medium cursor-pointer">About</span>
            </Link>
            <Link href="/help">
              <span className="text-gray-700 hover:text-blue-600 font-medium cursor-pointer">Help</span>
            </Link>
            <Button className="ml-2">
              Sign In
            </Button>
          </nav>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white p-4 rounded-md shadow-lg border border-gray-200 mt-2">
            <nav className="flex flex-col gap-4">
              <Link href="/">
                <span className="text-lg font-medium cursor-pointer" onClick={() => setIsMenuOpen(false)}>Home</span>
              </Link>
              <Link href="/search">
                <span className="text-lg font-medium cursor-pointer" onClick={() => setIsMenuOpen(false)}>Property Search</span>
              </Link>
              <Link href="/broadband">
                <span className="text-lg font-medium cursor-pointer" onClick={() => setIsMenuOpen(false)}>Broadband Lookup</span>
              </Link>
              <Link href="/fcc-broadband">
                <span className="text-lg font-medium cursor-pointer" onClick={() => setIsMenuOpen(false)}>FCC Broadband</span>
              </Link>
              <Link href="/census-test">
                <span className="text-lg font-medium cursor-pointer" onClick={() => setIsMenuOpen(false)}>Census Test</span>
              </Link>
              <Link href="/about">
                <span className="text-lg font-medium cursor-pointer" onClick={() => setIsMenuOpen(false)}>About</span>
              </Link>
              <Link href="/help">
                <span className="text-lg font-medium cursor-pointer" onClick={() => setIsMenuOpen(false)}>Help</span>
              </Link>
              <Button className="mt-2" onClick={() => setIsMenuOpen(false)}>
                Sign In
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;