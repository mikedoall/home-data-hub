import React, { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PropertyDetail from "@/components/ui/property-detail";
import SearchOtherProperties from "@/components/ui/search-other-properties";

const Property: React.FC = () => {
  const [match, params] = useRoute("/property/:id");
  const [location, setLocation] = useLocation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!match) {
      setLocation("/");
    }
  }, [match, setLocation]);

  if (!match) return null;

  const propertyId = parseInt(params.id);
  
  // Handle negative IDs (from geocoded properties that aren't in the database yet)
  if (propertyId < 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-2xl font-bold text-primary mb-4">Property Details Not Available</h2>
            <p className="mb-6 text-neutral-700">
              This address was found through our geocoding service but doesn't exist in our database yet.
              We're working on adding more detailed information for this property.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={() => setLocation("/")}>
                Return Home
              </Button>
              <Button variant="outline" onClick={() => window.history.back()}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
        <SearchOtherProperties />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PropertyDetail propertyId={propertyId} />
      <SearchOtherProperties />
    </div>
  );
};

export default Property;
