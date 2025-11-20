import React from 'react';
import { Home, Receipt, UserCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    {
      icon: Home,
      label: 'Home',
      path: '/'
    },
    {
      icon: Receipt,
      label: 'Orders',
      path: '/orders'
    },
    {
      icon: UserCircle,
      label: 'Account',
      path: '/profile'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all",
                isActive 
                  ? "text-red-600" 
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon className={cn(
                "w-6 h-6 transition-all",
                isActive && "scale-110"
              )} 
              strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={cn(
                "text-[10px] font-medium mt-0.5",
                isActive && "font-semibold"
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
