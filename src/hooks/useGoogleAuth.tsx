import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

export const useGoogleAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load Google Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const signIn = async () => {
    setIsLoading(true);
    try {
      const client = window.google?.accounts?.oauth2?.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.access_token) {
            setAccessToken(response.access_token);
            setIsAuthenticated(true);
            toast.success('Connected to Google');
          }
        },
      });

      client?.requestAccessToken();
    } catch (error) {
      console.error('Google auth error:', error);
      toast.error('Failed to connect to Google');
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    setAccessToken(null);
    setIsAuthenticated(false);
    toast.success('Disconnected from Google');
  };

  return {
    isAuthenticated,
    accessToken,
    isLoading,
    signIn,
    signOut,
  };
};
