import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, AlertCircle, ArrowRight, Siren, Cross, Brain, TriangleAlert, PhoneCall } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import hotlinesData from '../../data/philippines_hotlines.json';
import type { LucideIcon } from 'lucide-react';

interface Hotline {
  name: string;
  category: string;
  numbers: string[];
  description?: string;
}

const icons: Partial<Record<string, LucideIcon>> = {
  "National Emergency Hotline": TriangleAlert,
  "PNP Emergency": Siren,
  "Red Cross": Cross,
  "Mental Health Crisis Line": Brain,
};

interface CriticalHotlinesWidgetProps {
  maxItems?: number;
}

const CriticalHotlinesWidget: React.FC<CriticalHotlinesWidgetProps> = ({
  maxItems = 4,
}) => {
  const displayedHotlines = (hotlinesData.criticalHotlines as Hotline[]).slice(
    0,
    maxItems
  );

  return (
    <div>
      <div className="pb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <h3 className="font-semibold text-red-600 text-xl">Critical Emergency Hotlines</h3>
        </div>
        <Link 
          to="/philippines/hotlines" 
          className="text-red-600 text-sm hover:underline flex items-center gap-1"
        >
          <span>View all</span>
          <ArrowRight size={16} />
        </Link>
      </div>
      
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {displayedHotlines.map((hotline, index) => (
            <Card key={index} className="grid lg:grid-cols-[auto_auto] shadow-none border-gray-300">
              <CardHeader className="font-medium flex items-center gap-2 border-b-0">
                {(() => {
                  const Icon = icons[hotline.name]; // LucideIcon | undefined
                  return Icon ? <Icon className="h-6 w-6" /> : null;
                })()}
                <span className='text-lg'>{hotline.name}</span>
              </CardHeader>
              <CardContent className='flex items-center gap-2 flex-wrap lg:justify-end'>
                {hotline.numbers.map((number, idx) => (
                  <Link
                  key={idx} 
                    to={`tel:${number.replace(/\D/g, '')}`}
                    className="inline-flex group gap-3 items-center justify-center rounded-xl font-semibold transition-colors px-6 py-2 bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-sm"
                  >
                    <div className="group-hover:-translate-x-1 transition-all">
                      <Phone size={16} />
                    </div>
                    <span className='tracking-widest text-nowrap'>{number}</span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CriticalHotlinesWidget;
