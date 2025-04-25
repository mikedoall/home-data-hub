import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Droplet, Flame, Trash2 } from "lucide-react";
import { Utility } from "@shared/schema";
import { Link } from "wouter";

interface UtilitiesPreviewProps {
  utilities: Utility[];
  isPreview?: boolean;
}

const UtilitiesPreview: React.FC<UtilitiesPreviewProps> = ({ utilities, isPreview = true }) => {
  // Get the appropriate icon for each utility type
  const getUtilityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'electricity':
        return <Zap className="text-amber-500 h-6 w-6 mr-3" />;
      case 'water':
        return <Droplet className="text-blue-500 h-6 w-6 mr-3" />;
      case 'gas':
        return <Flame className="text-red-500 h-6 w-6 mr-3" />;
      case 'trash':
        return <Trash2 className="text-green-500 h-6 w-6 mr-3" />;
      default:
        return <Zap className="text-amber-500 h-6 w-6 mr-3" />;
    }
  };

  return (
    <div className={isPreview ? "bg-white rounded-xl custom-shadow p-6 md:p-8" : ""}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Utilities Information</h2>
        {isPreview && (
          <Link href="/property/1?tab=utilities">
            <Button variant="ghost" className="text-primary hover:text-primary-dark font-medium">
              View All Utilities Data
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {utilities.map((utility) => (
          <Card key={utility.id}>
            <CardContent className="p-5">
              <div className="flex items-center mb-4">
                {getUtilityIcon(utility.type)}
                <h3 className="text-lg font-semibold capitalize">{utility.type}</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="font-medium mb-1">
                    {utility.type === 'Electricity' ? 'Primary Provider' : 'Provider'}
                  </div>
                  <div className="flex justify-between">
                    <span>{utility.provider}</span>
                    {utility.type === 'Electricity' && (
                      <a href="#" className="text-primary text-sm">Compare Plans</a>
                    )}
                  </div>
                </div>
                
                <div>
                  <div className="font-medium mb-1">Estimated Monthly Cost</div>
                  <div className="flex justify-between">
                    <span>
                      {utility.estimatedCostMin === utility.estimatedCostMax
                        ? `$${utility.estimatedCostMin}`
                        : `$${utility.estimatedCostMin} - $${utility.estimatedCostMax}`}
                    </span>
                    <span className="text-sm text-neutral-500">
                      {utility.type === 'Gas' ? 'Seasonal variation' : 'Based on similar homes'}
                    </span>
                  </div>
                </div>
                
                {utility.additionalInfo && (
                  <div>
                    <div className="font-medium mb-1">
                      {utility.additionalInfo.split(":")[0]}
                    </div>
                    <div>
                      {utility.additionalInfo.split(":")[1]}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UtilitiesPreview;
