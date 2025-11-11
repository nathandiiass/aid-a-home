import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSpecialistMode = () => {
  const [isSpecialistMode, setIsSpecialistMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSpecialistRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsSpecialistMode(false);
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'specialist')
        .maybeSingle();

      setIsSpecialistMode(!!data);
      setIsLoading(false);
    };

    checkSpecialistRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSpecialistRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleSpecialistMode = (value: boolean) => {
    // This is now UI-only for switching between views
    // Actual role must exist in database
    setIsSpecialistMode(value);
  };

  return { isSpecialistMode, toggleSpecialistMode, isLoading };
};
