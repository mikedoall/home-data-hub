import React from "react";

export default function TailwindTestPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">Tailwind CSS Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="bg-red-100 p-4 rounded">Red background</div>
        <div className="bg-blue-100 p-4 rounded">Blue background</div>
        <div className="bg-green-100 p-4 rounded">Green background</div>
        <div className="bg-yellow-100 p-4 rounded">Yellow background</div>
      </div>
      
      <div className="mt-8">
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Tailwind Button
        </button>
      </div>
    </div>
  );
}