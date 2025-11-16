import React from 'react';
import { Home, ClipboardList, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const BottomNavSpecialist = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      icon: Home,
      label: 'Home',
      path: '/specialist'
    },
    {
      icon: ClipboardList,
      label: 'Orders',
      path: '/specialist/orders'
    },
    {
      icon: User,
      label: 'Account',
      path: '/specialist/account'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-red-600 z-50 shadow-lg">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-all"
            >
              <div className={cn(
                "flex items-center justify-center transition-all",
                isActive && item.label === 'Account' ? "w-10 h-10 rounded-full bg-white animate-bounce-in" : ""
              )}>
                <Icon 
                  className={cn(
                    "w-6 h-6 transition-colors",
                    isActive && item.label === 'Account' ? "text-red-600" : "text-white",
                    isActive && "animate-bounce-in"
                  )} 
                />
              </div>
              <span className={cn(
                "text-xs font-medium transition-colors",
                isActive ? "text-white font-semibold" : "text-white/80"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
