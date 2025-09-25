import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Senator } from '../../types/senate';
import { Card } from '../ui/Card';

interface VotingChartProps {
  senators: Senator[];
}

const VotingChart: React.FC<VotingChartProps> = ({ senators }) => {
  // Mock voting data for demonstration
  const votingData = [
    { name: 'Unanimous Yes', value: 45, color: '#10b981' },
    { name: 'Majority Yes', value: 23, color: '#3b82f6' },
    { name: 'Split Decision', value: 12, color: '#f59e0b' },
    { name: 'Majority No', value: 8, color: '#ef4444' },
    { name: 'No Quorum', value: 5, color: '#6b7280' },
  ];

  const partyAlignment = [
    { party: 'Independent', aligned: 78, opposed: 22 },
    { party: 'NPC', aligned: 85, opposed: 15 },
    { party: 'PDP-Laban', aligned: 72, opposed: 28 },
    { party: 'Liberal', aligned: 68, opposed: 32 },
    { party: 'Akbayan', aligned: 65, opposed: 35 },
  ];

  const attendanceBySession = [
    { session: 'Jan 2024', attendance: 92 },
    { session: 'Feb 2024', attendance: 89 },
    { session: 'Mar 2024', attendance: 94 },
    { session: 'Apr 2024', attendance: 87 },
    { session: 'May 2024', attendance: 91 },
    { session: 'Jun 2024', attendance: 93 },
  ];

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Voting Outcomes Distribution */}
        <Card className='p-6'>
          <h3 className='text-lg font-semibold mb-4'>
            Voting Outcomes Distribution
          </h3>
          <ResponsiveContainer width='100%' height={300}>
            <PieChart>
              <Pie
                data={votingData}
                cx='50%'
                cy='50%'
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill='#8884d8'
                dataKey='value'
              >
                {votingData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Party Line Voting */}
        <Card className='p-6'>
          <h3 className='text-lg font-semibold mb-4'>
            Party Line Voting Alignment
          </h3>
          <ResponsiveContainer width='100%' height={300}>
            <BarChart data={partyAlignment}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='party' />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey='aligned' fill='#10b981' name='Aligned with Party' />
              <Bar dataKey='opposed' fill='#ef4444' name='Opposed to Party' />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Session Attendance Trend */}
      <Card className='p-6'>
        <h3 className='text-lg font-semibold mb-4'>Session Attendance Trend</h3>
        <ResponsiveContainer width='100%' height={250}>
          <BarChart data={attendanceBySession}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='session' />
            <YAxis domain={[70, 100]} />
            <Tooltip formatter={value => `${value}%`} />
            <Bar dataKey='attendance' fill='#3b82f6' name='Attendance Rate'>
              {attendanceBySession.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.attendance >= 90
                      ? '#10b981'
                      : entry.attendance >= 80
                        ? '#f59e0b'
                        : '#ef4444'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Voting Participation Matrix */}
      <Card className='p-6'>
        <h3 className='text-lg font-semibold mb-4'>
          Senator Voting Participation
        </h3>
        <div className='overflow-x-auto'>
          <table className='min-w-full'>
            <thead>
              <tr className='border-b'>
                <th className='text-left py-2 px-3 text-sm font-medium text-gray-700'>
                  Senator
                </th>
                <th className='text-center py-2 px-3 text-sm font-medium text-gray-700'>
                  Yes Votes
                </th>
                <th className='text-center py-2 px-3 text-sm font-medium text-gray-700'>
                  No Votes
                </th>
                <th className='text-center py-2 px-3 text-sm font-medium text-gray-700'>
                  Abstentions
                </th>
                <th className='text-center py-2 px-3 text-sm font-medium text-gray-700'>
                  Absent
                </th>
                <th className='text-center py-2 px-3 text-sm font-medium text-gray-700'>
                  Participation
                </th>
              </tr>
            </thead>
            <tbody>
              {senators.slice(0, 5).map(senator => (
                <tr key={senator.id} className='border-b hover:bg-gray-50'>
                  <td className='py-2 px-3 text-sm font-medium'>
                    {senator.name}
                  </td>
                  <td className='text-center py-2 px-3 text-sm'>
                    <span className='text-green-600 font-medium'>
                      {Math.floor(senator.stats.votingParticipation * 0.6)}
                    </span>
                  </td>
                  <td className='text-center py-2 px-3 text-sm'>
                    <span className='text-red-600 font-medium'>
                      {Math.floor(senator.stats.votingParticipation * 0.2)}
                    </span>
                  </td>
                  <td className='text-center py-2 px-3 text-sm'>
                    <span className='text-yellow-600 font-medium'>
                      {Math.floor(senator.stats.votingParticipation * 0.1)}
                    </span>
                  </td>
                  <td className='text-center py-2 px-3 text-sm'>
                    <span className='text-gray-600 font-medium'>
                      {Math.floor(
                        (100 - senator.stats.votingParticipation) * 0.9
                      )}
                    </span>
                  </td>
                  <td className='text-center py-2 px-3 text-sm'>
                    <div className='flex items-center justify-center'>
                      <div className='w-16 bg-gray-200 rounded-full h-2 mr-2'>
                        <div
                          className='bg-primary-500 h-2 rounded-full'
                          style={{
                            width: `${senator.stats.votingParticipation}%`,
                          }}
                        />
                      </div>
                      <span className='text-xs font-medium'>
                        {senator.stats.votingParticipation.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default VotingChart;
