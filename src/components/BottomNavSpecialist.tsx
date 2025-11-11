import React from 'react';
import { List, ClipboardCheck, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const BottomNavSpecialist = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      icon: List,
      label: 'Inicio',
      path: '/specialist'
    },
    {
      icon: ClipboardCheck,
      label: 'Órdenes',
      path: '/specialist/orders'
    },
    {
      icon: User,
      label: 'Perfil',
      path: '/profile'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-gray-medium hover:text-gray-dark"
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium font-roboto">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
