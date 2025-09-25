import React from 'react';
import {
  FileText,
  Clock,
  Users,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Bill } from '../../types/senate';

interface BillCardProps {
  bill: Bill;
  compact?: boolean;
}

const BillCard: React.FC<BillCardProps> = ({ bill, compact = false }) => {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Pending in Committee': 'bg-yellow-100 text-yellow-800',
      'In Committee': 'bg-blue-100 text-blue-800',
      'Reported out of Committee': 'bg-indigo-100 text-indigo-800',
      'Pending Second Reading': 'bg-purple-100 text-purple-800',
      'Pending Third Reading': 'bg-pink-100 text-pink-800',
      'Passed on Third Reading': 'bg-green-100 text-green-800',
      'Transmitted to House': 'bg-cyan-100 text-cyan-800',
      'In Bicameral Conference': 'bg-orange-100 text-orange-800',
      Enrolled: 'bg-teal-100 text-teal-800',
      'Signed into Law': 'bg-green-500 text-white',
      Vetoed: 'bg-red-100 text-red-800',
      Withdrawn: 'bg-gray-100 text-gray-800',
      default: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors.default;
  };

  const getUrgencyIcon = (urgency?: string) => {
    if (urgency === 'Urgent') {
      return <AlertCircle className='w-4 h-4 text-red-500' />;
    }
    if (urgency === 'Priority') {
      return <AlertCircle className='w-4 h-4 text-yellow-500' />;
    }
    return null;
  };

  if (compact) {
    return (
      <Link to={`/government/senate/bill/${bill.id}`}>
        <div className='flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer'>
          <div className='flex items-center gap-3 flex-1'>
            <FileText className='w-5 h-5 text-gray-400' />
            <div className='flex-1'>
              <div className='flex items-center gap-2'>
                <span className='font-semibold text-gray-900'>
                  {bill.number}
                </span>
                {getUrgencyIcon(bill.urgency)}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(bill.status)}`}
                >
                  {bill.status}
                </span>
              </div>
              <p className='text-sm text-gray-600 line-clamp-1'>
                {bill.shortTitle || bill.title}
              </p>
            </div>
          </div>
          <ChevronRight className='w-4 h-4 text-gray-400' />
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/government/senate/bill/${bill.id}`}>
      <Card className='hover:shadow-lg transition-shadow cursor-pointer'>
        <div className='p-6'>
          {/* Header */}
          <div className='flex items-start justify-between mb-3'>
            <div className='flex items-start gap-3 flex-1'>
              <FileText className='w-6 h-6 text-gray-400 mt-1' />
              <div className='flex-1'>
                <div className='flex items-center gap-2 mb-1'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    {bill.number}
                  </h3>
                  {getUrgencyIcon(bill.urgency)}
                </div>
                <h4 className='text-gray-700 font-medium'>
                  {bill.shortTitle || bill.title}
                </h4>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bill.status)}`}
            >
              {bill.status}
            </span>
          </div>

          {/* Description */}
          <p className='text-sm text-gray-600 mb-4 line-clamp-2'>
            {bill.description}
          </p>

          {/* Authors */}
          <div className='flex items-center gap-2 mb-3'>
            <Users className='w-4 h-4 text-gray-400' />
            <span className='text-sm text-gray-600'>
              By:{' '}
              <span className='font-medium text-gray-900'>
                {bill.authors.join(', ')}
              </span>
              {bill.coAuthors.length > 0 && (
                <span className='text-gray-500'>
                  {' '}
                  (+{bill.coAuthors.length} co-authors)
                </span>
              )}
            </span>
          </div>

          {/* Subject Tags */}
          <div className='flex flex-wrap gap-2 mb-4'>
            {bill.subject.slice(0, 3).map(subj => (
              <span
                key={subj}
                className='text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded'
              >
                {subj}
              </span>
            ))}
          </div>

          {/* Timeline Progress */}
          {bill.timeline.length > 0 && (
            <div className='border-t pt-3'>
              <div className='flex items-center justify-between text-sm'>
                <div className='flex items-center gap-2 text-gray-600'>
                  <Clock className='w-4 h-4' />
                  <span>
                    Filed: {new Date(bill.dateField).toLocaleDateString()}
                  </span>
                </div>
                <div className='text-gray-600'>
                  Last action:{' '}
                  {new Date(bill.lastActionDate).toLocaleDateString()}
                </div>
              </div>

              {/* Progress Bar */}
              <div className='mt-2'>
                <div className='flex gap-1'>
                  {[
                    'Filed',
                    'Committee',
                    'Second Reading',
                    'Third Reading',
                    'Transmitted',
                  ].map(stage => {
                    const completed = bill.timeline.some(event =>
                      event.action.toLowerCase().includes(stage.toLowerCase())
                    );
                    return (
                      <div
                        key={stage}
                        className={`flex-1 h-1 rounded-full ${
                          completed ? 'bg-primary-500' : 'bg-gray-200'
                        }`}
                        title={stage}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Committee Assignment */}
          {bill.committee && (
            <div className='mt-3 pt-3 border-t'>
              <p className='text-xs text-gray-500'>
                Assigned to:{' '}
                <span className='font-medium text-gray-700'>
                  {bill.committee}
                </span>
              </p>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
};

export default BillCard;
