import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  DollarSign,
  Clock
} from 'lucide-react';
import { useWashFlow } from '../../context/WashFlowContext';

export const AnalyticsView: React.FC = () => {
  const { stats, settings, showToast } = useWashFlow();
  const [reportRange, setReportRange] = useState<'today' | 'week' | 'month'>('today');

  const peakHours = [
    { hour: '08:00 AM', count: 3, percentage: 30 },
    { hour: '09:00 AM', count: 5, percentage: 50 },
    { hour: '10:00 AM', count: 7, percentage: 70 },
    { hour: '11:00 AM', count: 6, percentage: 60 },
    { hour: '12:00 PM (Peak)', count: 8, percentage: 80, isPeak: true },
    { hour: '01:00 PM', count: 5, percentage: 50 },
    { hour: '02:00 PM', count: 4, percentage: 40 },
    { hour: '03:00 PM', count: 5, percentage: 50 },
    { hour: '04:00 PM', count: 3, percentage: 30 },
    { hour: '05:00 PM', count: 2, percentage: 20 }
  ];

  const servicesBreakdown = [
    { name: 'Full Body & Underwash', revenue: 10800, count: 18, share: 44 },
    { name: 'Exterior Foam Wash', revenue: 4200, count: 12, share: 17 },
    { name: 'Ceramic Waxing & Polish', revenue: 6000, count: 5, share: 24 },
    { name: 'Interior Vacuum & Wipe', revenue: 3500, count: 8, share: 15 }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-[#eaf3ff] border border-[#cfe0f4] rounded-xl p-5 shadow-[0_6px_20px_rgba(32,64,100,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-white text-[#1b5fad] flex items-center justify-center shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Business performance
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Reconcile camera foot-traffic with revenue collections, attendant productivity, and customer basket sizes.
          </p>
        </div>

        <div className="flex items-center gap-2">
            <div className="bg-white/80 border border-[#cfe0f4] p-1 rounded-lg flex items-center text-xs font-semibold">
            {(['today', 'week', 'month'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setReportRange(r)}
                  className={`px-3 py-1.5 rounded-md capitalize transition-colors ${
                  reportRange === r
                    ? 'bg-white text-blue-600 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === 'today' ? 'Today' : r === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>

          <button
            onClick={() => showToast('Full business performance report generated')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#d5e0eb] hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Conversion Funnel Banner */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-[#dfe7f1] shadow-[0_6px_20px_rgba(32,64,100,0.05)] space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Vehicle-to-Sale Conversion Funnel
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Entrance camera detections vs verified POS checkouts
            </p>
          </div>
          <span className="text-sm font-extrabold text-[#1b5fad] bg-[#eaf3ff] px-3 py-2 rounded-lg border border-[#cfe0f4] whitespace-nowrap">
            {stats.conversionRate}% Conversion
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="bg-[#eaf3ff] border border-[#cfe0f4] rounded-lg p-4">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
              1. Entrance Detections
            </span>
            <div className="text-2xl font-extrabold text-[#17365f] mt-1">
              {stats.vehiclesToday} Vehicles
            </div>
            <p className="text-[11px] text-blue-700 mt-1">
              100% of physical traffic at Gate 1
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              2. Completed POS Sales
            </span>
            <div className="text-2xl font-extrabold text-emerald-950 mt-1">
              {stats.completedSales} Paid Tickets
            </div>
            <p className="text-[11px] text-emerald-700 mt-1">
              {stats.conversionRate}% conversion efficiency
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              3. Unbilled / Drop-offs
            </span>
            <div className="text-2xl font-extrabold text-amber-950 mt-1">
              {stats.unbilledVehicles} Vehicles
            </div>
            <p className="text-[11px] text-amber-700 mt-1">
              Vehicles in bay or non-paying entries
            </p>
          </div>
        </div>
      </div>

      {/* Row: Peak Hours & Revenue by Service */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Peak Hours */}
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-[#dfe7f1] shadow-[0_6px_20px_rgba(32,64,100,0.05)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Peak Traffic Hours</h3>
              <p className="text-xs text-slate-500 mt-0.5">Distribution of vehicle arrivals throughout the day</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#eaf3ff] text-[#1b5fad] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            {peakHours.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-semibold ${item.isPeak ? 'text-blue-600 font-extrabold' : 'text-slate-700'}`}>
                    {item.hour}
                  </span>
                  <span className="font-bold text-slate-900">{item.count} cars</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.isPeak ? 'bg-[#1b5fad]' : 'bg-[#8bb8e8]'}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Service Breakdown */}
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-[#dfe7f1] shadow-[0_6px_20px_rgba(32,64,100,0.05)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Revenue Contribution by Service</h3>
              <p className="text-xs text-slate-500 mt-0.5">Top revenue generating packages</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {servicesBreakdown.map((s, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-[#f7faff] border border-[#e4ebf4] flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{s.name}</h4>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {s.count} orders • {s.share}% of daily total
                  </div>
                </div>
                <div className="text-sm font-extrabold text-[#17365f] whitespace-nowrap">
                  {settings.currency} {s.revenue.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
