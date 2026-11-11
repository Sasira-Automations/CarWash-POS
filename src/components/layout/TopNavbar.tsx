import React, { useState } from 'react';
import {
  Menu,
  MapPin,
  Search,
  Bell,
  ChevronDown,
  Plus
} from 'lucide-react';
import { useWashFlow } from '../../context/WashFlowContext';

interface TopNavbarProps {
  onMenuToggle: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onMenuToggle }) => {
  const {
    settings,
    setActiveTab,
    detections,
    quickChargePlateInPOS
  } = useWashFlow();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const waitingArrivals = detections.filter((d) => d.waitingForSale);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    quickChargePlateInPOS(searchQuery.trim().toUpperCase());
    setSearchQuery('');
  };

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

          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-200 transition-colors">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs font-bold text-slate-900 leading-tight">
                <span>{settings.businessName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
              </div>
              <div className="text-[11px] text-slate-400">{settings.branch} · {settings.location}</div>
            </div>
          </div>
        </div>

        {/* Center: Search Plate / Receipt (with ⌘ K) */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex-1 max-w-md relative hidden md:block"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plate, receipt or customer"
            className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 pl-9 pr-14 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs pointer-events-none">
            ⌘ K
          </kbd>
        </form>

        {/* Right Section: IoT Status + Bell + Profile + New Sale Button */}
        <div className="flex items-center gap-3">
          {/* Camera integration is intentionally simulated until hardware is verified. */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Demo data · IoT pending</span>
          </div>

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
                        <div className="font-mono font-bold text-slate-900">{det.plateNumber}</div>
                        <div className="text-[10px] text-slate-500">{det.vehicleType}</div>
                      </div>
                      <button
                        onClick={() => {
                          quickChargePlateInPOS(det.plateNumber);
                          setShowNotifications(false);
                        }}
                        className="text-[10px] font-bold text-white bg-blue-600 px-2 py-1 rounded-lg"
                      >
                        Bill
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Attendant Profile */}
          <div className="hidden md:flex items-center gap-2 pl-1 border-l border-slate-200/80 cursor-pointer">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-900 leading-tight">Staff account</div>
              <div className="text-[10px] text-slate-400">Wash attendant</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* + New Sale Primary CTA */}
          <button
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New sale</span>
          </button>
        </div>
      </div>
    </header>
  );
};
