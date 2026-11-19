import React, { useState } from 'react';
import {
  Menu,
  MapPin,
  Bell,
  LogOut,
  User
} from 'lucide-react';
import { useWashFlow } from '../../context/WashFlowContext';
import { useAuth } from '../../context/AuthContext';

interface TopNavbarProps {
  onMenuToggle: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onMenuToggle }) => {
  const {
    settings,
    detections
  } = useWashFlow();
  const { user, signOut } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);

  const waitingArrivals = detections.filter((d) => d.waitingForSale);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4 max-w-[1600px] mx-auto">
        {/* Left Section: Mobile Menu + Branch Selector */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-200 transition-colors">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs font-bold text-slate-900 leading-tight">
                <span>{settings.businessName}</span>
              </div>
              <div className="text-[11px] text-slate-400">{settings.branch} · {settings.location}</div>
            </div>
          </div>
        </div>

        {/* Right Section: Notifications */}
        <div className="flex items-center gap-3">
          {/* Bell Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {waitingArrivals.length > 0 && (
                <span className="absolute 1 top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-900">
                  <span>Live Entrance Arrivals</span>
                  <span className="text-[11px] text-blue-600 font-semibold">{waitingArrivals.length} waiting</span>
                </div>
                <div className="py-2 space-y-2 max-h-52 overflow-y-auto">
                  {waitingArrivals.map((det) => (
                    <div
                      key={det.id}
                      className="p-2 bg-slate-50 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{det.vehicleClass}</div>
                        <div className="text-[10px] text-slate-500">{det.vehicleType}</div>
                        <div className="text-[10px] text-slate-400">{det.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Owner Profile Chip */}
          <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs shadow-xs overflow-hidden shrink-0">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName || 'Owner profile'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to initials if image link breaks
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : user?.fullName ? (
                user.fullName.charAt(0).toUpperCase()
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[140px]">
                {user?.fullName || 'Car Wash Owner'}
              </div>
              <div className="text-[10px] text-blue-600 font-semibold leading-tight">
                Owner Account
              </div>
            </div>
            <button
              onClick={() => signOut()}
              title="Sign out of owner session"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
