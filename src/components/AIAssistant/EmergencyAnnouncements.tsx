import React, { useEffect, useState } from 'react';
import { AlertTriangle, Cloud, Activity, MapPin, Clock, X } from 'lucide-react';

export interface EmergencyAnnouncement {
  id: string;
  type: 'typhoon' | 'earthquake' | 'flood' | 'volcanic' | 'advisory';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  description: string;
  location?: string;
  timestamp: Date;
  source: string;
  expiresAt?: Date;
}

interface EmergencyAnnouncementsProps {
  announcements?: EmergencyAnnouncement[];
}

export const EmergencyAnnouncements: React.FC<EmergencyAnnouncementsProps> = ({
  announcements = [],
}) => {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [activeAnnouncements, setActiveAnnouncements] = useState<
    EmergencyAnnouncement[]
  >([]);

  useEffect(() => {
    // Filter out dismissed and expired announcements
    const now = new Date();
    const active = announcements.filter(
      ann =>
        !dismissedIds.has(ann.id) && (!ann.expiresAt || ann.expiresAt > now)
    );
    setActiveAnnouncements(active);
  }, [announcements, dismissedIds]);

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-500 text-red-900';
      case 'high':
        return 'bg-orange-50 border-orange-500 text-orange-900';
      case 'moderate':
        return 'bg-yellow-50 border-yellow-500 text-yellow-900';
      default:
        return 'bg-blue-50 border-blue-500 text-blue-900';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'typhoon':
        return <Cloud className='h-5 w-5' />;
      case 'earthquake':
        return <Activity className='h-5 w-5' />;
      case 'volcanic':
        return <AlertTriangle className='h-5 w-5' />;
      default:
        return <AlertTriangle className='h-5 w-5' />;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  if (activeAnnouncements.length === 0) return null;

  return (
    <div className='space-y-3 mb-6'>
      {activeAnnouncements.map(announcement => (
        <div
          key={announcement.id}
          className={`border-l-4 rounded-lg p-4 ${getSeverityStyles(announcement.severity)}`}
        >
          <div className='flex items-start justify-between'>
            <div className='flex items-start flex-1'>
              <div className='mr-3 mt-0.5'>
                {getTypeIcon(announcement.type)}
              </div>
              <div className='flex-1'>
                <div className='flex items-center gap-2 mb-1'>
                  <h4 className='font-semibold text-sm'>
                    {announcement.title}
                  </h4>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      announcement.severity === 'critical'
                        ? 'bg-red-200 text-red-800'
                        : announcement.severity === 'high'
                          ? 'bg-orange-200 text-orange-800'
                          : announcement.severity === 'moderate'
                            ? 'bg-yellow-200 text-yellow-800'
                            : 'bg-blue-200 text-blue-800'
                    }`}
                  >
                    {announcement.severity.toUpperCase()}
                  </span>
                </div>
                <p className='text-sm mb-2'>{announcement.description}</p>
                <div className='flex items-center gap-4 text-xs opacity-75'>
                  {announcement.location && (
                    <div className='flex items-center gap-1'>
                      <MapPin className='h-3 w-3' />
                      {announcement.location}
                    </div>
                  )}
                  <div className='flex items-center gap-1'>
                    <Clock className='h-3 w-3' />
                    {formatTimestamp(announcement.timestamp)}
                  </div>
                  <div>Source: {announcement.source}</div>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleDismiss(announcement.id)}
              className='ml-4 text-gray-500 hover:text-gray-700'
              aria-label='Dismiss announcement'
            >
              <X className='h-4 w-4' />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EmergencyAnnouncements;
