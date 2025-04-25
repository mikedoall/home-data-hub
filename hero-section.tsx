import React from "react";
import { Wifi, School, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const HeroSection: React.FC = () => {
  return (
    <section className="mb-12">
      <Card className="bg-white custom-shadow">
        <CardContent className="p-6 md:p-8">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Find Complete Household Data for Any Property
            </h1>
            <p className="text-lg text-neutral-700">
              Internet providers, school zones, utilities, and more - all in one place.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center p-4">
              <div className="bg-primary bg-opacity-20 p-4 rounded-full mb-4">
                <Wifi className="text-primary h-8 w-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Internet Options</h3>
              <p className="text-neutral-600">Compare available providers, speeds, and pricing</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4">
              <div className="bg-primary bg-opacity-20 p-4 rounded-full mb-4">
                <School className="text-primary h-8 w-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">School Districts</h3>
              <p className="text-neutral-600">View assigned schools and district information</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4">
              <div className="bg-primary bg-opacity-20 p-4 rounded-full mb-4">
                <Zap className="text-primary h-8 w-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Utility Data</h3>
              <p className="text-neutral-600">Discover energy providers and average costs</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default HeroSection;
