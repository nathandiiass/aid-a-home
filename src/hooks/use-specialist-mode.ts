import { useState, useEffect } from 'react';

export const useSpecialistMode = () => {
  const [isSpecialistMode, setIsSpecialistMode] = useState(() => {
    return localStorage.getItem('specialist-mode') === 'true';
  });

  const toggleSpecialistMode = (value: boolean) => {
    setIsSpecialistMode(value);
    localStorage.setItem('specialist-mode', String(value));
  };

  return { isSpecialistMode, toggleSpecialistMode };
};
