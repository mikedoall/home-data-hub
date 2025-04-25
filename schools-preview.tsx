import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Building, Star, Users } from "lucide-react";
import { School } from "@shared/schema";
import { Link } from "wouter";

interface SchoolsPreviewProps {
  schools: School[];
  isPreview?: boolean;
}

const SchoolsPreview: React.FC<SchoolsPreviewProps> = ({ schools, isPreview = true }) => {
  // Group schools by type
  const schoolsByType: Record<string, School> = {};
  
  schools.forEach(school => {
    schoolsByType[school.type] = school;
  });
  
  const displaySchools = isPreview 
    ? Object.values(schoolsByType) // Show one of each type for preview
    : schools; // Show all schools for full view
  
  return (
    <div className={isPreview ? "bg-white rounded-xl custom-shadow p-6 md:p-8" : ""}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">School Information</h2>
        {isPreview && (
          <Link href="/property/1?tab=schools">
            <Button variant="ghost" className="text-primary hover:text-primary-dark font-medium">
              View All School Data
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displaySchools.map((school) => (
          <Card key={school.id}>
            <CardHeader className="bg-primary-light bg-opacity-10 px-4 py-3 border-b border-neutral-200">
              <h3 className="font-medium">{school.type} School</h3>
            </CardHeader>
            <CardContent className="p-4">
              <div className="font-semibold text-lg mb-2">{school.name}</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start">
                  <MapPin className="text-neutral-500 h-4 w-4 mr-2 mt-0.5" />
                  <span>{school.address}</span>
                </div>
                <div className="flex items-start">
                  <Building className="text-neutral-500 h-4 w-4 mr-2 mt-0.5" />
                  <span>{school.district}</span>
                </div>
                <div className="flex items-start">
                  <Star className="text-neutral-500 h-4 w-4 mr-2 mt-0.5" />
                  <span>School Rating: {school.rating}/10</span>
                </div>
                <div className="flex items-start">
                  <Users className="text-neutral-500 h-4 w-4 mr-2 mt-0.5" />
                  <span>Student-Teacher Ratio: {school.studentTeacherRatio}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SchoolsPreview;
