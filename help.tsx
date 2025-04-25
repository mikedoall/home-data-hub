import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Help: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <h1 className="text-3xl font-bold text-neutral-900">Help Center</h1>
          <p className="text-neutral-600 mt-2">
            Find answers to common questions about using HomeDataHub.
          </p>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How do I search for a property?</AccordionTrigger>
              <AccordionContent>
                <p>
                  You can search for a property by entering an address, neighborhood, city, or ZIP code 
                  in the search bar at the top of the page. As you type, you'll see suggestions 
                  appear below the search bar. Click on a suggestion to view detailed information 
                  about that property.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger>How accurate is the internet availability data?</AccordionTrigger>
              <AccordionContent>
                <p>
                  Our internet availability data is sourced from the FCC Broadband Map and directly 
                  from internet service providers. While we strive for accuracy, availability can 
                  sometimes change based on new infrastructure or service area expansions. We 
                  recommend verifying availability with the provider for the most current information.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>How often is the school zone information updated?</AccordionTrigger>
              <AccordionContent>
                <p>
                  School zone information is updated annually or whenever school districts announce 
                  boundary changes. We work directly with school districts to ensure our data reflects 
                  current assignments. For the most accurate information, we recommend confirming 
                  with the school district directly, especially if you're making critical decisions 
                  based on school assignments.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger>Are the utility cost estimates accurate?</AccordionTrigger>
              <AccordionContent>
                <p>
                  Utility cost estimates are based on averages for similar homes in the area and 
                  data provided by utility companies. Actual costs can vary based on usage patterns, 
                  seasonal factors, and the efficiency of appliances in the home. We provide ranges 
                  to give you a general idea of what to expect.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger>Can I request data for a property that isn't in your system?</AccordionTrigger>
              <AccordionContent>
                <p>
                  Yes! If you search for a property and don't find results, you can request that we 
                  add it to our database. Click the "Request Property Data" button that appears when 
                  no results are found, and fill out the form with as much information as you have. 
                  Our team will research the property and add it to our system, typically within 2-3 
                  business days.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-6">
              <AccordionTrigger>How do I report incorrect information?</AccordionTrigger>
              <AccordionContent>
                <p>
                  If you notice any incorrect information about a property, please click the "Report 
                  an Issue" link at the bottom of the property page. Provide as much detail as possible 
                  about what information is incorrect and, if you know it, what the correct information 
                  should be. Our data team will review your report and make necessary corrections.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <div className="mt-8 p-6 bg-neutral-50 rounded-lg border border-neutral-200">
            <h3 className="text-lg font-semibold mb-2">Still need help?</h3>
            <p className="mb-4">
              If you couldn't find the answer you're looking for, please contact our support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="font-medium mb-1">Email Support</div>
                <a href="mailto:support@homedatahub.com" className="text-primary">
                  support@homedatahub.com
                </a>
              </div>
              <div className="flex-1">
                <div className="font-medium mb-1">Phone Support</div>
                <a href="tel:1-800-555-1234" className="text-primary">
                  1-800-555-1234
                </a>
                <div className="text-sm text-neutral-500">
                  Mon-Fri, 9am-5pm ET
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Help;
