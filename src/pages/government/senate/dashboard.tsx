import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, Users, FileText, BarChart3, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { Senator, Bill, DashboardFilters } from '../../../types/senate';
import SenatorCard from '../../../components/senate/SenatorCard';
import BillCard from '../../../components/senate/BillCard';
import VotingChart from '../../../components/senate/VotingChart';
import PerformanceMetrics from '../../../components/senate/PerformanceMetrics';

// Import mock data
import senatorsData from '../../../data/senate/senators.json';
import billsData from '../../../data/senate/bills.json';

const SenateDashboard: React.FC = () => {
  const [senators, setSenators] = useState<Senator[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'senators' | 'bills' | 'votes' | 'performance'>('overview');
  const [filters, setFilters] = useState<DashboardFilters>({
    searchTerm: '',
    sortBy: 'name'
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Load data
    setSenators(senatorsData.senators as Senator[]);
    setBills(billsData.bills as Bill[]);
  }, []);

  const handleSearch = (term: string) => {
    setFilters(prev => ({ ...prev, searchTerm: term }));
  };

  const filteredSenators = senators.filter(senator => {
    if (!filters.searchTerm) return true;
    const term = filters.searchTerm.toLowerCase();
    return (
      senator.name.toLowerCase().includes(term) ||
      senator.party.toLowerCase().includes(term) ||
      senator.position?.toLowerCase().includes(term)
    );
  });

  const filteredBills = bills.filter(bill => {
    if (!filters.searchTerm) return true;
    const term = filters.searchTerm.toLowerCase();
    return (
      bill.number.toLowerCase().includes(term) ||
      bill.title.toLowerCase().includes(term) ||
      bill.authors.some(author => author.toLowerCase().includes(term)) ||
      bill.subject.some(subj => subj.toLowerCase().includes(term))
    );
  });

  const stats = {
    totalSenators: senators.length,
    activeBills: bills.filter(b => !['Signed into Law', 'Vetoed', 'Withdrawn'].includes(b.status)).length,
    passedBills: bills.filter(b => b.status === 'Signed into Law').length,
    avgAttendance: senators.reduce((sum, s) => sum + s.stats.attendanceRate, 0) / senators.length || 0
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Senate Activity Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Track bills, votes, and performance of Philippine senators
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/government/senate/bills/new">
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Track New Bill
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search senators, bills, committees..."
                value={filters.searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 mt-4 border-t pt-4">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'senators', label: 'Senators', icon: Users },
              { id: 'bills', label: 'Bills', icon: FileText },
              { id: 'votes', label: 'Voting Records', icon: Calendar },
              { id: 'performance', label: 'Performance', icon: BarChart3 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-2 px-1 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Senators</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalSenators}</p>
                  </div>
                  <Users className="w-8 h-8 text-primary-500" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Bills</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeBills}</p>
                  </div>
                  <FileText className="w-8 h-8 text-yellow-500" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Passed Bills</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.passedBills}</p>
                  </div>
                  <FileText className="w-8 h-8 text-green-500" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Attendance</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.avgAttendance.toFixed(1)}%</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                </div>
              </Card>
            </div>

            {/* Top Performers */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Top Performing Senators</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {senators
                  .sort((a, b) => b.stats.billsPassed - a.stats.billsPassed)
                  .slice(0, 3)
                  .map(senator => (
                    <SenatorCard key={senator.id} senator={senator} compact />
                  ))}
              </div>
            </Card>

            {/* Recent Bills */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Legislative Activity</h2>
              <div className="space-y-4">
                {bills.slice(0, 5).map(bill => (
                  <BillCard key={bill.id} bill={bill} compact />
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Senators Tab */}
        {activeTab === 'senators' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSenators.map(senator => (
              <SenatorCard key={senator.id} senator={senator} />
            ))}
          </div>
        )}

        {/* Bills Tab */}
        {activeTab === 'bills' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {filteredBills.length} Bills Found
              </h2>
              <select
                className="px-3 py-2 border rounded-lg text-sm"
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
              >
                <option value="recent">Most Recent</option>
                <option value="name">By Number</option>
                <option value="status">By Status</option>
              </select>
            </div>
            {filteredBills.map(bill => (
              <BillCard key={bill.id} bill={bill} />
            ))}
          </div>
        )}

        {/* Votes Tab */}
        {activeTab === 'votes' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Voting Patterns Analysis</h2>
              <VotingChart senators={senators} bills={bills} />
            </Card>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <PerformanceMetrics senators={senators} bills={bills} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SenateDashboard;