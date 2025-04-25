import React from "react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {/* HEADER */}
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">HomeDataHub</h1>
        <input
          type="text"
          placeholder="Search for an address, city, or ZIP code"
          className="w-80 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </header>

      {/* HERO */}
      <section className="text-center py-10 px-4">
        <h2 className="text-3xl font-bold mb-2">Find Complete Household Data for Any Property</h2>
        <p className="text-gray-600 text-lg">
          Internet providers, school zones, utilities, and more — all in one place.
        </p>
      </section>

      {/* FEATURES GRID */}
      <main className="max-w-6xl mx-auto px-6 grid gap-6 md:grid-cols-3 mb-12">
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
          <h3 className="text-xl font-semibold mb-2">📶 Internet Options</h3>
          <p className="text-gray-500 text-sm">Compare available providers, speeds, and pricing.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
          <h3 className="text-xl font-semibold mb-2">🏫 School Districts</h3>
          <p className="text-gray-500 text-sm">View assigned schools and district info.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
          <h3 className="text-xl font-semibold mb-2">⚡ Utility Data</h3>
          <p className="text-gray-500 text-sm">Discover average energy providers and costs.</p>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t p-4 text-center text-sm text-gray-500">
        © 2025 HomeDataHub. All rights reserved.
      </footer>
    </div>
  );
}