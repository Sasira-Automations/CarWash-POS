import React from 'react';
import {
  CarFront,
  Menu,
  ReceiptText,
  BarChart3,
  Home
} from 'lucide-react';
import { useWashFlow } from '../../context/WashFlowContext';

interface BottomNavProps {
  onMenuToggle: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onMenuToggle }) => {
  const { activeTab, setActiveTab, detections } = useWashFlow();

  const waitingCount = detections.filter((d) => d.waitingForSale).length;

  const isMoreActive = [
    'services',
    'customers',
    'expenses',
    'cameras',
    'settings'
  ].includes(activeTab);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: Home,
      isActive: activeTab === 'dashboard',
      onClick: () => setActiveTab('dashboard')
    },
    {
      id: 'monitoring',
      label: 'Vehicles',
      icon: CarFront,
      badge: waitingCount > 0 ? waitingCount : undefined,
      isActive: activeTab === 'monitoring',
      onClick: () => setActiveTab('monitoring')
    },
    {
      id: 'transactions',
      label: 'Records',
      icon: ReceiptText,
      isActive: activeTab === 'transactions',
      onClick: () => setActiveTab('transactions')
    },
    {
      id: 'analytics',
      label: 'Reports',
      icon: BarChart3,
      isActive: activeTab === 'analytics',
      onClick: () => setActiveTab('analytics')
    },
    {
      id: 'more',
      label: 'Menu',
      icon: Menu,
      isActive: isMoreActive,
      onClick: onMenuToggle
    }
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_25px_rgba(15,23,42,0.08)] pb-[max(0.35rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-1.5 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive;

          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={`relative flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition-all select-none touch-manipulation ${
                isActive
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight leading-none ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 w-4 h-0.5 rounded-full bg-blue-600" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
