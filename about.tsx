import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const About: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <h1 className="text-3xl font-bold text-neutral-900">About HomeDataHub</h1>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p className="text-lg mb-4">
              HomeDataHub is a comprehensive platform designed to provide essential household 
              information for residential properties. Our mission is to help homebuyers and 
              renters make informed decisions by consolidating critical data about internet 
              service options, school zones, utility providers, and more.
            </p>
            
            <h2 className="text-2xl font-bold mt-6 mb-3">Our Vision</h2>
            <p>
              We believe that access to complete and accurate property information should 
              be seamless and straightforward. By aggregating data from various trusted sources, 
              we eliminate the need for multiple searches across different platforms, saving 
              you time and reducing the stress of property research.
            </p>
            
            <h2 className="text-2xl font-bold mt-6 mb-3">Our Data Sources</h2>
            <p>
              HomeDataHub utilizes data from authoritative sources to ensure accuracy and 
              reliability, including:
            </p>
            <ul className="list-disc pl-5 space-y-2 my-4">
              <li>FCC Broadband Map for internet availability data</li>
              <li>Official school district databases for educational zoning information</li>
              <li>Utility company service areas and pricing information</li>
              <li>Public property records and assessments</li>
            </ul>
            <p>
              We regularly update our database to provide the most current information 
              available for every property in our system.
            </p>
            
            <h2 className="text-2xl font-bold mt-6 mb-3">How It Works</h2>
            <p>
              Simply enter an address, neighborhood, city, or ZIP code into our search 
              bar to access comprehensive information about properties in that area. 
              Our intuitive interface displays internet options, school assignments, 
              utility providers, and basic property details in an easy-to-understand format.
            </p>
            
            <h2 className="text-2xl font-bold mt-6 mb-3">Contact Us</h2>
            <p>
              Have questions or suggestions? We'd love to hear from you! 
              Contact our support team at support@homedatahub.com or use the 
              contact form on our website.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default About;
