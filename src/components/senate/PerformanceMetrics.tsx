import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Award,
  Target,
  Users,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Senator } from '../../types/senate';

interface PerformanceMetricsProps {
  senators: Senator[];
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: string;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  senators,
}) => {
  // Calculate performance metrics
  const getTopPerformers = () => {
    return senators
      .map(senator => ({
        ...senator,
        productivityScore:
          senator.stats.billsPassed * 10 +
          senator.stats.billsAuthored * 2 +
          senator.stats.attendanceRate * 0.5 +
          senator.stats.votingParticipation * 0.3,
      }))
      .sort((a, b) => b.productivityScore - a.productivityScore);
  };

  const topPerformers = getTopPerformers();
  const averageMetrics = {
    attendance:
      senators.reduce((sum, s) => sum + s.stats.attendanceRate, 0) /
      senators.length,
    billsAuthored:
      senators.reduce((sum, s) => sum + s.stats.billsAuthored, 0) /
      senators.length,
    billsPassed:
      senators.reduce((sum, s) => sum + s.stats.billsPassed, 0) /
      senators.length,
    votingParticipation:
      senators.reduce((sum, s) => sum + s.stats.votingParticipation, 0) /
      senators.length,
  };

  const MetricCard = ({
    title,
    value,
    change,
    icon: Icon,
    color,
  }: MetricCardProps) => (
    <Card className='p-4'>
      <div className='flex items-start justify-between'>
        <div>
          <p className='text-sm text-gray-600'>{title}</p>
          <p className='text-2xl font-bold mt-1'>{value}</p>
          {change && (
            <div className='flex items-center mt-2'>
              {change > 0 ? (
                <TrendingUp className='w-4 h-4 text-green-500 mr-1' />
              ) : (
                <TrendingDown className='w-4 h-4 text-red-500 mr-1' />
              )}
              <span
                className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {Math.abs(change)}% vs last period
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className='w-6 h-6 text-white' />
        </div>
      </div>
    </Card>
  );

  return (
    <div className='space-y-6'>
      {/* Overview Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <MetricCard
          title='Average Attendance'
          value={`${averageMetrics.attendance.toFixed(1)}%`}
          change={2.3}
          icon={Users}
          color='bg-blue-500'
        />
        <MetricCard
          title='Bills Authored (Avg)'
          value={Math.round(averageMetrics.billsAuthored)}
          change={-1.2}
          icon={Activity}
          color='bg-purple-500'
        />
        <MetricCard
          title='Bills Passed (Avg)'
          value={Math.round(averageMetrics.billsPassed)}
          change={5.7}
          icon={Award}
          color='bg-green-500'
        />
        <MetricCard
          title='Voting Participation'
          value={`${averageMetrics.votingParticipation.toFixed(1)}%`}
          change={1.8}
          icon={Target}
          color='bg-orange-500'
        />
      </div>

      {/* Top Performers Leaderboard */}
      <Card className='p-6'>
        <h3 className='text-lg font-semibold mb-4'>Performance Leaderboard</h3>
        <div className='overflow-x-auto'>
          <table className='min-w-full'>
            <thead>
              <tr className='border-b bg-gray-50'>
                <th className='text-left py-3 px-4 text-sm font-medium text-gray-700'>
                  Rank
                </th>
                <th className='text-left py-3 px-4 text-sm font-medium text-gray-700'>
                  Senator
                </th>
                <th className='text-left py-3 px-4 text-sm font-medium text-gray-700'>
                  Party
                </th>
                <th className='text-center py-3 px-4 text-sm font-medium text-gray-700'>
                  Bills Passed
                </th>
                <th className='text-center py-3 px-4 text-sm font-medium text-gray-700'>
                  Bills Authored
                </th>
                <th className='text-center py-3 px-4 text-sm font-medium text-gray-700'>
                  Attendance
                </th>
                <th className='text-center py-3 px-4 text-sm font-medium text-gray-700'>
                  Score
                </th>
              </tr>
            </thead>
            <tbody>
              {topPerformers.map((senator, index) => (
                <tr
                  key={senator.id}
                  className={`border-b hover:bg-gray-50 ${index < 3 ? 'bg-yellow-50' : ''}`}
                >
                  <td className='py-3 px-4'>
                    <div className='flex items-center'>
                      {index === 0 && <span className='text-2xl mr-2'>🥇</span>}
                      {index === 1 && <span className='text-2xl mr-2'>🥈</span>}
                      {index === 2 && <span className='text-2xl mr-2'>🥉</span>}
                      {index >= 3 && (
                        <span className='text-gray-600 font-medium'>
                          {index + 1}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className='py-3 px-4'>
                    <div>
                      <p className='font-medium text-gray-900'>
                        {senator.name}
                      </p>
                      {senator.position && (
                        <p className='text-xs text-gray-500'>
                          {senator.position}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className='py-3 px-4'>
                    <span className='px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700'>
                      {senator.party}
                    </span>
                  </td>
                  <td className='text-center py-3 px-4'>
                    <span className='font-medium text-green-600'>
                      {senator.stats.billsPassed}
                    </span>
                  </td>
                  <td className='text-center py-3 px-4'>
                    <span className='font-medium'>
                      {senator.stats.billsAuthored}
                    </span>
                  </td>
                  <td className='text-center py-3 px-4'>
                    <div className='flex items-center justify-center'>
                      <div className='w-16 bg-gray-200 rounded-full h-2 mr-2'>
                        <div
                          className={`h-2 rounded-full ${
                            senator.stats.attendanceRate >= 90
                              ? 'bg-green-500'
                              : senator.stats.attendanceRate >= 75
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${senator.stats.attendanceRate}%` }}
                        />
                      </div>
                      <span className='text-xs'>
                        {senator.stats.attendanceRate}%
                      </span>
                    </div>
                  </td>
                  <td className='text-center py-3 px-4'>
                    <span className='font-bold text-primary-600'>
                      {senator.productivityScore.toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Committee Performance */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card className='p-6'>
          <h3 className='text-lg font-semibold mb-4'>Most Active Committees</h3>
          <div className='space-y-3'>
            {[
              { name: 'Finance', bills: 23, meetings: 48 },
              { name: 'Health and Demography', bills: 19, meetings: 42 },
              { name: 'Education', bills: 17, meetings: 38 },
              { name: 'Labor and Employment', bills: 15, meetings: 35 },
              { name: 'Climate Change', bills: 12, meetings: 30 },
            ].map((committee, index) => (
              <div
                key={index}
                className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
              >
                <div>
                  <p className='font-medium text-gray-900'>{committee.name}</p>
                  <p className='text-xs text-gray-500'>
                    {committee.meetings} meetings held
                  </p>
                </div>
                <div className='text-right'>
                  <p className='font-bold text-primary-600'>
                    {committee.bills}
                  </p>
                  <p className='text-xs text-gray-500'>bills processed</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className='p-6'>
          <h3 className='text-lg font-semibold mb-4'>
            Bill Success Rate by Type
          </h3>
          <div className='space-y-4'>
            {[
              { type: 'Economic Bills', total: 45, passed: 12, rate: 26.7 },
              { type: 'Social Welfare', total: 38, passed: 15, rate: 39.5 },
              { type: 'Healthcare', total: 32, passed: 8, rate: 25.0 },
              { type: 'Education', total: 28, passed: 10, rate: 35.7 },
              { type: 'Infrastructure', total: 25, passed: 6, rate: 24.0 },
            ].map((category, index) => (
              <div key={index}>
                <div className='flex justify-between text-sm mb-1'>
                  <span className='text-gray-700'>{category.type}</span>
                  <span className='text-gray-600'>
                    {category.passed}/{category.total} ({category.rate}%)
                  </span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-primary-500 h-2 rounded-full'
                    style={{ width: `${category.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
