import React from "react";
import { Link } from "wouter";
import { Facebook, Twitter, Instagram, ExternalLink } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-neutral-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="text-2xl font-bold mb-4">HomeDataHub</div>
            <p className="text-neutral-400 mb-4">
              Comprehensive property data for informed decisions about your next home.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-neutral-400 hover:text-white">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-neutral-400 hover:text-white">Data Sources</a>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white">API Documentation</a>
              </li>
              <li>
                <a 
                  href="https://broadbandmap.fcc.gov/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-neutral-400 hover:text-white flex items-center"
                >
                  FCC Broadband Map
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white">School Ratings</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about">
                  <span className="text-neutral-400 hover:text-white cursor-pointer">About Us</span>
                </Link>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white">Careers</a>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white">Press</a>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white">Contact</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-neutral-400 hover:text-white">Terms of Service</a>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white">Data Usage Policy</a>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white">Accessibility</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-neutral-800 text-center text-neutral-500">
          <p>&copy; {new Date().getFullYear()} HomeDataHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
