import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSpecialistMode = () => {
  const [isSpecialistMode, setIsSpecialistMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSpecialistRole();
  }, []);

  const checkSpecialistRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsSpecialistMode(false);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('specialist_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setIsSpecialistMode(!!data);
    } catch (error) {
      console.error('Error checking specialist role:', error);
      setIsSpecialistMode(false);
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
          return;
        }

        const { data, error } = await supabase
          .from('specialist_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        setIsSpecialistMode(!!data);
      } catch (error) {
        console.error('Error checking specialist profile:', error);
        setIsSpecialistMode(false);
      }
    } else {
      setIsSpecialistMode(false);
    }
  };

  return { isSpecialistMode, toggleSpecialistMode, isLoading };
};
