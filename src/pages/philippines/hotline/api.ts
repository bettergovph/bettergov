import { toast } from 'sonner';
import { useState } from 'react';

const api = async <T>(path: string, options: RequestInit) => {
  const baseUrl = import.meta.env.VITE_MAILER_API as string;
  const res = await fetch(baseUrl + path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Request failed with status ${res.status}`);
  }
  const data = await res.text();

  return data ? (JSON.parse(data) as T) : {};
};

const useSendOutdatedHotlineReport = () => {
  const [isError, setError] = useState<boolean>(false);
  const [isLoading, setLoading] = useState(false);

  const sendOutdatedHotlineReport = async (payload: {
    organization: string;
    outdated_hotline: string;
    updated_hotline: string;
  }) => {
    try {
      setLoading(true);
      const response = await api<{ message: string }>('/hotlines/outdated', {
        method: 'post',
        body: JSON.stringify(payload),
      });
      toast.success('Report sent', {
        description: 'Your report was successfully sent',
      });
      return response;
    } catch (error) {
      setError(true);
      toast.error('Failed to send', {
        description: 'Your report was not sent',
      });
      console.error('Failed to send hotline report:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    isError,
    isLoading,
    sendOutdatedHotlineReport,
  };
};

export { useSendOutdatedHotlineReport };
