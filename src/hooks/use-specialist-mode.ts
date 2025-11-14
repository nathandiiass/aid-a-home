import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SPECIALIST_MODE_KEY = 'specialist_mode';

export const useSpecialistMode = () => {
  const [isSpecialistMode, setIsSpecialistMode] = useState(() => {
    return localStorage.getItem(SPECIALIST_MODE_KEY) === 'true';
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSpecialistRole();
  }, []);

  const checkSpecialistRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsSpecialistMode(false);
        localStorage.removeItem(SPECIALIST_MODE_KEY);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('specialist_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      // If user doesn't have specialist profile, clear mode
      if (!data) {
        setIsSpecialistMode(false);
        localStorage.removeItem(SPECIALIST_MODE_KEY);
      }
      // If user has profile, respect the stored mode preference
    } catch (error) {
      console.error('Error checking specialist role:', error);
      setIsSpecialistMode(false);
      localStorage.removeItem(SPECIALIST_MODE_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSpecialistMode = async (value: boolean) => {
    if (value) {
      // Re-verify the user has specialist profile before enabling
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsSpecialistMode(false);
          localStorage.removeItem(SPECIALIST_MODE_KEY);
          return;
        }

        const { data, error } = await supabase
          .from('specialist_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setIsSpecialistMode(true);
          localStorage.setItem(SPECIALIST_MODE_KEY, 'true');
        } else {
          setIsSpecialistMode(false);
          localStorage.removeItem(SPECIALIST_MODE_KEY);
        }
      } catch (error) {
        console.error('Error checking specialist profile:', error);
        setIsSpecialistMode(false);
        localStorage.removeItem(SPECIALIST_MODE_KEY);
      }
    } else {
      setIsSpecialistMode(false);
      localStorage.removeItem(SPECIALIST_MODE_KEY);
    }
  };

  return { isSpecialistMode, toggleSpecialistMode, isLoading };
};
