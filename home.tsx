import React from "react";
import SearchBar from "@/components/ui/search-bar";
import { Link } from "wouter";

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <Link href="/">
          <h1 className="text-2xl font-bold text-blue-600 cursor-pointer">HomeDataHub</h1>
        </Link>
        <div className="w-96">
          <SearchBar />
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid gap-6 md:grid-cols-3">
        <section className="col-span-full text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Find Complete Household Data for Any Property</h2>
          <p className="text-gray-600">Internet providers, school zones, utilities, and more - all in one place.</p>
        </section>

        <div className="bg-white p-6 shadow rounded-lg">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <span className="mr-2">🏡</span> Internet Options
          </h3>
          <p className="text-sm text-gray-500">Compare providers, speeds, and pricing for any address.</p>
          <div className="mt-4 text-blue-600 text-sm font-medium">
            <Link href="/broadband">
              <span className="cursor-pointer">Check availability →</span>
            </Link>
          </div>
        </div>
        
        <div className="bg-white p-6 shadow rounded-lg">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <span className="mr-2">🎓</span> School Districts
          </h3>
          <p className="text-sm text-gray-500">View assigned schools, ratings, and district boundaries.</p>
          <div className="mt-4 text-blue-600 text-sm font-medium">
            <Link href="/schools">
              <span className="cursor-pointer">Find schools →</span>
            </Link>
          </div>
        </div>
        
        <div className="bg-white p-6 shadow rounded-lg">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <span className="mr-2">⚡</span> Utility Data
          </h3>
          <p className="text-sm text-gray-500">Discover energy providers and average monthly costs.</p>
          <div className="mt-4 text-blue-600 text-sm font-medium">
            <Link href="/utilities">
              <span className="cursor-pointer">View utilities →</span>
            </Link>
          </div>
        </div>
        
        <div className="col-span-full bg-white p-6 shadow rounded-lg mt-6">
          <h3 className="text-xl font-bold mb-4">How to Use HomeDataHub</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li className="text-gray-700">Enter an address in the search box above</li>
            <li className="text-gray-700">View comprehensive property data including internet, schools, and utilities</li>
            <li className="text-gray-700">Compare options and make informed decisions about your home</li>
          </ol>
        </div>
      </main>
    </div>
  );
};

export default Home;
