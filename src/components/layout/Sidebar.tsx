import React from 'react';
import { useWashFlow } from '../../context/WashFlowContext';

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

const CarPlusIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M16.5 6.5c-.38-.47-.94-.75-1.55-.75H5.85c-.69 0-1.3.36-1.65.93L2.2 10.1C2.07 10.32 2 10.58 2 10.85V15.5c0 .83.67 1.5 1.5 1.5h.7c.38 1.16 1.48 2 2.8 2s2.42-.84 2.8-2h3.45c-.16-.48-.25-.98-.25-1.5 0-1.28.51-2.45 1.34-3.3l-1.34-1.2h-7l1.2-2.5h6.3l1 2.05c.65-.22 1.35-.35 2.08-.35.49 0 .97.06 1.42.17l-1-2.37zM7 17.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12.5-3.5v2.5H17v2h2.5V21h2v-2.5H24v-2h-2.5V14h-2z" />
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

const LogOutIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { activeTab, setActiveTab, showToast } = useWashFlow();

  const handleLogout = () => {
    showToast('Logged out of SparkleWash');
    setActiveTab('dashboard');
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
      id: 'pos',
      label: 'New Wash',
      icon: CarPlusIcon,
      isActive: activeTab === 'pos' || activeTab === 'monitoring',
      onClick: () => setActiveTab('pos')
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
      id: 'settings',
      label: 'Settings',
      icon: ServicesGearIcon,
      isActive: activeTab === 'settings' || activeTab === 'cameras' || activeTab === 'help',
      onClick: () => setActiveTab('settings')
    },
    {
      id: 'logout',
      label: 'Log Out',
      icon: LogOutIcon,
      isActive: false,
      onClick: handleLogout
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
            <div className="sidebar-logo px-2 flex justify-center">
              <img
                src="/images/sidebar-logo.png"
                alt="SparkleWash - Clean Drive, Happy You"
                className="sidebar-logo-image w-full max-w-[190px] object-contain select-none pointer-events-none"
              />
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

          {/* Bottom Water Splash & Blue Sedan Car Graphic */}
          <div className="sidebar-bottom-art mt-auto w-full select-none pointer-events-none overflow-hidden rounded-b-[26px] shrink-0">
            <img
              src="/images/sidebar-bottom-car.png"
              alt="SparkleWash Car Wash"
              className="sidebar-bottom-image w-full object-contain object-bottom block"
            />
          </div>
        </div>
      </aside>
    </>
  );
};
