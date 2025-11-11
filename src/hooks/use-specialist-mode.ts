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
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'specialist')
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

  const toggleSpecialistMode = (value: boolean) => {
    // Only allow toggling if user has specialist role
    if (value) {
      checkSpecialistRole();
    } else {
      setIsSpecialistMode(false);
    }
  };

  return { isSpecialistMode, toggleSpecialistMode, isLoading };
};
