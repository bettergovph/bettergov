import React from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  ArrowRight,
  Siren,
  Cross,
  Brain,
  TriangleAlert,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import hotlinesData from '../../data/philippines_hotlines.json';
import type { LucideIcon } from 'lucide-react';

interface Hotline {
  name: string;
  category: string;
  numbers: string[];
  description?: string;
}

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

  function getIcon(hotline_name: string) {
    const icons: Partial<Record<string, LucideIcon>> = {
      'National Emergency Hotline': TriangleAlert,
      'PNP Emergency': Siren,
      'Red Cross': Cross,
      'Mental Health Crisis Line': Brain,
    };
    const Icon = icons[hotline_name];
    return Icon ? <Icon className='h-6 w-6' /> : null;
  }

  return (
    <div>
      <div className='mb-4 flex items-center justify-between flex-wrap gap-4 border p-2 pl-6 bg-red-50 rounded-xl border-gray-400 shadow-sm'>
        <div className='flex items-center gap-2'>
          <Phone size={18} className='text-red-600' />
          <h3 className='font-semibold text-red-600 text-xl'>
            Critical Emergency Hotlines
          </h3>
        </div>
        <Link
          to='/philippines/hotlines'
          className='text-white text-sm hover:underline flex items-center gap-1 bg-red-500 hover:bg-red-600 font-semibold px-4 py-2 rounded-md'
        >
          <span>View all</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      <div>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          {displayedHotlines.map((hotline, index) => (
            <Card
              key={index}
              className='shadow-none border-gray-400 shadow-sm flex flex-col justify-between'
            >
              <CardHeader className='font-medium flex items-center gap-2 border-b-0'>
                {getIcon(hotline.name)}
                <span className='text-lg'>{hotline.name}</span>
              </CardHeader>
              <CardContent className='flex flex-col items-centerflex-wrap lg:justify-end p-0 md:p-0 border-t divide-y-[1px]'>
                {hotline.numbers.map((number, idx) => (
                  <Link
                    key={idx}
                    to={`tel:${number.replace(/\D/g, '')}`}
                    className='inline-flex group gap-3 items-center justify-center font-semibold transition-colors px-6 py-2 text-blue-500 hover:text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                  >
                    <div className='group-hover:-translate-x-1 transition-all'>
                      <Phone size={16} />
                    </div>
                    <span className='tracking-widest text-nowrap'>
                      {number}
                    </span>
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
