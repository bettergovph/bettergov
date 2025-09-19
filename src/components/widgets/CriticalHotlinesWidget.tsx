import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, ChevronRight, AlertCircle, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import hotlinesData from '../../data/philippines_hotlines.json';

interface Hotline {
  name: string;
  category: string;
  numbers: string[];
  description?: string;
}

interface CriticalHotlinesWidgetProps {
  maxItems?: number;
}

const CriticalHotlinesWidget: React.FC<CriticalHotlinesWidgetProps> = ({ maxItems = 4 }) => {
  const displayedHotlines = (hotlinesData.criticalHotlines as Hotline[]).slice(0, maxItems);

  return (
    <Card>
      <CardHeader className="bg-red-600 p-4 md:p-6 flex items-center justify-between">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-white mr-2" />
          <h3 className="font-bold text-white">Critical Emergency Hotlines</h3>
        </div>
        <Link 
          to="/philippines/hotlines" 
          className="text-white text-sm hover:underline flex items-center"
        >
          View all <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {displayedHotlines.map((hotline, index) => (
            <div key={index} className="flex flex-col">
              <span className="font-medium text-gray-900">{hotline.name}</span>
              <div className="mt-1 space-y-1">
                {hotline.numbers.map((number, idx) => (
                  <a 
                    key={idx} 
                    href={`tel:${number.replace(/\D/g, '')}`}
                    className="flex items-center text-blue-600 hover:underline"
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    <span className="text-sm">{number}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-200 text-center group">
          <Link 
            to="/philippines/hotlines" 
            className="inline-flex gap-1 items-center text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            <span>See all emergency hotlines</span>
            <span className='group-hover:translate-x-1 transition-transform'>
              <ArrowRight size={16} />
            </span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default CriticalHotlinesWidget;
