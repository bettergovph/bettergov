import React from 'react';
import { User, FileText, Calendar, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Senator } from '../../types/senate';

interface SenatorCardProps {
  senator: Senator;
  compact?: boolean;
}

const SenatorCard: React.FC<SenatorCardProps> = ({
  senator,
  compact = false,
}) => {
  const getPartyColor = (party: string) => {
    const colors: Record<string, string> = {
      Liberal: 'bg-yellow-100 text-yellow-800',
      NPC: 'bg-green-100 text-green-800',
      'PDP-Laban': 'bg-red-100 text-red-800',
      Independent: 'bg-gray-100 text-gray-800',
      Akbayan: 'bg-purple-100 text-purple-800',
      default: 'bg-gray-100 text-gray-800',
    };
    return colors[party] || colors.default;
  };

  if (compact) {
    return (
      <Link to={`/government/senate/senator/${senator.id}`}>
        <Card className='p-4 hover:shadow-lg transition-shadow cursor-pointer'>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center'>
              <User className='w-6 h-6 text-gray-600' />
            </div>
            <div className='flex-1'>
              <h3 className='font-semibold text-gray-900'>{senator.name}</h3>
              <div className='flex items-center gap-2 text-sm'>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${getPartyColor(senator.party)}`}
                >
                  {senator.party}
                </span>
                {senator.position && (
                  <span className='text-gray-600'>{senator.position}</span>
                )}
              </div>
            </div>
            <div className='text-right'>
              <p className='text-sm text-gray-600'>
                {senator.stats.billsPassed} bills passed
              </p>
              <p className='text-xs text-gray-500'>
                {senator.stats.attendanceRate}% attendance
              </p>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link to={`/government/senate/senator/${senator.id}`}>
      <Card className='hover:shadow-lg transition-shadow cursor-pointer h-full'>
        <div className='p-6'>
          {/* Header */}
          <div className='flex items-start justify-between mb-4'>
            <div className='flex items-center gap-3'>
              <div className='w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center'>
                <User className='w-8 h-8 text-gray-600' />
              </div>
              <div>
                <h3 className='text-lg font-semibold text-gray-900'>
                  {senator.name}
                </h3>
                {senator.position && (
                  <p className='text-sm text-gray-600'>{senator.position}</p>
                )}
              </div>
            </div>
          </div>

          {/* Party Badge */}
          <div className='mb-4'>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPartyColor(senator.party)}`}
            >
              {senator.party}
            </span>
          </div>

          {/* Stats Grid */}
          <div className='grid grid-cols-2 gap-4 mb-4'>
            <div>
              <div className='flex items-center gap-1 text-gray-600 mb-1'>
                <FileText className='w-4 h-4' />
                <span className='text-xs'>Bills Authored</span>
              </div>
              <p className='text-2xl font-bold text-gray-900'>
                {senator.stats.billsAuthored}
              </p>
            </div>
            <div>
              <div className='flex items-center gap-1 text-gray-600 mb-1'>
                <TrendingUp className='w-4 h-4' />
                <span className='text-xs'>Bills Passed</span>
              </div>
              <p className='text-2xl font-bold text-green-600'>
                {senator.stats.billsPassed}
              </p>
            </div>
          </div>

          {/* Attendance Bar */}
          <div className='mb-4'>
            <div className='flex justify-between text-sm mb-1'>
              <span className='text-gray-600'>Attendance Rate</span>
              <span className='font-medium'>
                {senator.stats.attendanceRate}%
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className={`h-2 rounded-full transition-all ${
                  senator.stats.attendanceRate >= 90
                    ? 'bg-green-500'
                    : senator.stats.attendanceRate >= 75
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${senator.stats.attendanceRate}%` }}
              />
            </div>
          </div>

          {/* Committees */}
          {senator.committees.length > 0 && (
            <div className='border-t pt-4'>
              <p className='text-xs text-gray-600 mb-2'>Committee Roles</p>
              <div className='flex flex-wrap gap-1'>
                {senator.committees.slice(0, 2).map(committee => (
                  <span
                    key={committee.id}
                    className='text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded'
                  >
                    {committee.role === 'Chairperson'
                      ? 'Chair'
                      : committee.role}
                    : {committee.name.split(' ').slice(0, 3).join(' ')}
                  </span>
                ))}
                {senator.committees.length > 2 && (
                  <span className='text-xs text-gray-500'>
                    +{senator.committees.length - 2} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Term Info */}
          <div className='mt-4 pt-4 border-t flex items-center justify-between text-xs text-gray-500'>
            <span>
              Term: {new Date(senator.termStart).getFullYear()} -{' '}
              {new Date(senator.termEnd).getFullYear()}
            </span>
            <Calendar className='w-3 h-3' />
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default SenatorCard;
