import React from "react";

export default function TailwindCleanPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">HomeDataHub</h1>
          <div className="relative w-72">
            <input
              type="text"
              placeholder="Search properties..."
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-blue-50 py-10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Find All the Data About Your Home</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get comprehensive information about internet providers, schools, and utilities for any residential property.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <div className="rounded-xl bg-white shadow-md hover:shadow-lg transition p-6 border border-gray-100">
              <div className="text-blue-500 text-2xl mb-4">📶</div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">Internet Options</h3>
              <p className="text-gray-600">
                Compare available providers, speeds and pricing options for your location.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="rounded-xl bg-white shadow-md hover:shadow-lg transition p-6 border border-gray-100">
              <div className="text-blue-500 text-2xl mb-4">🏫</div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">School Zones</h3>
              <p className="text-gray-600">
                View assigned schools and district information for any address.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="rounded-xl bg-white shadow-md hover:shadow-lg transition p-6 border border-gray-100">
              <div className="text-blue-500 text-2xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">Utility Data</h3>
              <p className="text-gray-600">
                Find average utility costs and available service providers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Ready to explore your property data?</h2>
          <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">
            Search Now
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-600 mb-4 md:mb-0">
              © 2025 HomeDataHub. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-500 hover:text-blue-600">About</a>
              <a href="#" className="text-gray-500 hover:text-blue-600">Contact</a>
              <a href="#" className="text-gray-500 hover:text-blue-600">Privacy</a>
              <a href="#" className="text-gray-500 hover:text-blue-600">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}