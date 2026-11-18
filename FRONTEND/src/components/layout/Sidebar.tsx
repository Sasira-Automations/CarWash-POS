import React, { useState } from 'react';
import { CarFront, Droplets, Wallet, Settings, LogOut, CircleUserRound } from 'lucide-react';
import { useWashFlow } from '../../context/WashFlowContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

// Pixel-perfect SVG icons matching the reference design
const HomeIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2.7L2.5 11h2.5v9.3a1 1 0 001 1h4a1 1 0 001-1v-5h2v5a1 1 0 001 1h4a1 1 0 001-1V11h2.5L12 2.7z" />
  </svg>
);

const ServicesGearIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6-3.6 3.6z" />
  </svg>
);

const ClipboardRecordsIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-1.25 14.5L6.5 13.25l1.41-1.41 2.84 2.83 6.34-6.34 1.41 1.41-7.75 7.76z" />
  </svg>
);

const CustomersIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  </svg>
);

const ReportsBarsIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <rect x="4" y="12" width="3.5" height="8" rx="1.75" />
    <rect x="10.25" y="7" width="3.5" height="13" rx="1.75" />
    <rect x="16.5" y="3" width="3.5" height="17" rx="1.75" />
  </svg>
);

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { activeTab, setActiveTab, showToast } = useWashFlow();
  const { user, signOut } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    setMobileOpen(false);
    await signOut();
    showToast('Signed out of owner session');
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: HomeIcon,
      isActive: activeTab === 'dashboard',
      onClick: () => setActiveTab('dashboard')
    },
    {
      id: 'monitoring',
      label: 'Vehicles',
      icon: CarFront,
      isActive: activeTab === 'monitoring',
      onClick: () => setActiveTab('monitoring')
    },
    {
      id: 'services',
      label: 'Services',
      icon: ServicesGearIcon,
      isActive: activeTab === 'services',
      onClick: () => setActiveTab('services')
    },
    {
      id: 'records',
      label: 'Records',
      icon: ClipboardRecordsIcon,
      isActive: activeTab === 'transactions',
      onClick: () => setActiveTab('transactions')
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: CustomersIcon,
      isActive: activeTab === 'customers',
      onClick: () => setActiveTab('customers')
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: ReportsBarsIcon,
      isActive: activeTab === 'analytics',
      onClick: () => setActiveTab('analytics')
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: Wallet,
      isActive: activeTab === 'expenses',
      onClick: () => setActiveTab('expenses')
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Outer Blue Frame Container */}
      <aside
        className={`fixed lg:sticky top-0 h-dvh z-50 w-[270px] shrink-0 pl-3.5 pt-3.5 pb-3.5 pr-3.5 lg:pr-0 bg-[#195de4] flex flex-col transition-transform duration-300 ease-in-out select-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Inner White Rounded Card */}
        <div className="bg-white rounded-[26px] h-full min-h-0 flex flex-col justify-between overflow-hidden shadow-[12px_0_35px_-8px_rgba(25,93,228,0.2)] relative border border-white/50">
          <div>
            {/* Top Logo with Splash & Tagline */}
            <div className="sidebar-logo px-4 flex items-center justify-center gap-2.5 text-[#17365f]">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eaf3ff] text-[#1b5fad]">
                <Droplets className="h-5 w-5" />
              </span>
              <span className="text-lg font-extrabold tracking-tight">WashFlow</span>
            </div>

            {/* Navigation List */}
            <nav className="sidebar-nav px-3.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.isActive;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.onClick();
                      setMobileOpen(false);
                    }}
                    className={`sidebar-nav-item w-full flex items-center gap-3 px-3.5 py-2 rounded-[14px] text-sm font-semibold transition-all duration-150 text-left select-none ${
                      isActive
                        ? 'bg-[#196ef5] text-white shadow-[0_8px_20px_-4px_rgba(25,110,245,0.45)]'
                        : 'text-[#142d68] hover:bg-blue-50/70 hover:text-[#196ef5]'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 ${
                        isActive ? 'text-white' : 'text-[#142d68]'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="relative mt-auto flex items-center px-5 pb-5 pt-4">
            <button
              type="button"
              onClick={() => setProfileMenuOpen((open) => !open)}
              aria-label="Open profile menu"
              aria-expanded={profileMenuOpen}
              title="Profile and account settings"
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#b8d3f0] bg-[#eaf3ff] text-[#1b5fad] shadow-[0_4px_12px_rgba(27,95,173,0.16)] transition hover:bg-blue-100 hover:shadow-[0_6px_16px_rgba(27,95,173,0.22)] focus:outline-none focus:ring-4 focus:ring-blue-500/20"
            >
              <CircleUserRound className="h-7 w-7" strokeWidth={1.8} />
            </button>
            {profileMenuOpen && (
              <div className="absolute bottom-[calc(100%-8px)] left-3 z-20 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-[0_12px_30px_rgba(24,50,82,0.18)]">
                <div className="border-b border-slate-100 px-3 py-2">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {user?.fullName || 'Car Wash Owner'}
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-500 truncate">
                    {user?.email || 'Owner Account'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('settings');
                    setProfileMenuOpen(false);
                    setMobileOpen(false);
                  }}
                  className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Settings className="h-4 w-4 text-slate-500" />
                  Settings
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
