import { toast } from "sonner";
import { useState } from "react";
import axios from "axios";

const useMailerApi = () => {
  const api = axios.create({
    baseURL: import.meta.env.VITE_MAILER_API,
  });

  /**
   * Use this hook for sending an outdated hotline report
   */
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
        const response = await api.post<{ message: string }>(
          "/hotlines/outdated",
          payload
        );
        toast.success("Report sent", {
          description: "Your report was successfully sent",
        });
        return response.data;
      } catch (error) {
        setError(true);
        toast.error("Failed to send", {
          description: "Your report was not sent",
        });
        console.error("Failed to send hotline report:", error);
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

  return { api, useSendOutdatedHotlineReport };
};

export { useMailerApi };
