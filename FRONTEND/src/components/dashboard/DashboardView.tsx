import React, { useState } from 'react';
import {
  Car,
  Camera,
  ZoomIn,
  X,
  Receipt,
  BarChart3,
  ArrowUpRight,
  Activity,
  Droplets
} from 'lucide-react';
import { useWashFlow } from '../../context/WashFlowContext';
import { VehicleDetection } from '../../types';
import { getVehicleClassConfig } from '../../lib/vehicleUtils';

export const DashboardView: React.FC = () => {
  const {
    captures,
    transactions,
    setActiveTab,
    setSelectedReceipt,
    settings,
    stats,
    isSupabaseConnected
  } = useWashFlow();

  const [previewCapture, setPreviewCapture] = useState<VehicleDetection | null>(null);

  const captureCount = captures.length;
  const visibleTransactions = transactions.slice(0, 5);
  const paymentMethods = [
    { label: 'M-Pesa', amount: stats.revenueByMethod['M-Pesa'], color: 'bg-blue-600' },
    { label: 'Cash', amount: stats.revenueByMethod.Cash, color: 'bg-emerald-500' },
    { label: 'Card', amount: stats.revenueByMethod.Card, color: 'bg-amber-400' }
  ];
  const formatKsh = (amount: number) => `KSh ${amount.toLocaleString('en-KE')}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <section
        className="relative isolate overflow-hidden rounded-xl bg-[#0b1830] px-5 py-6 text-white shadow-lg shadow-blue-950/10 sm:px-7 sm:py-7"
        style={{
          backgroundImage: "linear-gradient(90deg, rgba(7, 19, 39, .86) 0%, rgba(7, 19, 39, .68) 48%, rgba(7, 19, 39, .22) 100%), url('/images/car-wash-banner-art.png')",
          backgroundPosition: 'center 46%',
          backgroundSize: 'cover'
        }}
      >
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200">
              <Droplets className="h-3.5 w-3.5" />
              WashFlow / Operations
            </div>
            <h1 className="max-w-2xl text-2xl font-extrabold leading-tight sm:text-3xl">
              A smoother shift starts here.
            </h1>
            <p className="mt-2 text-sm text-slate-200">
              {settings.branch} <span className="mx-1.5 text-slate-500">/</span> Vehicle captures and recorded payments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-slate-950/35 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              {captureCount} recent captures
            </div>
            <button
              onClick={() => setActiveTab('monitoring')}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 transition-colors hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              <Activity className="h-4 w-4" />
              View vehicle captures
            </button>
          </div>
        </div>
      </section>

      {/* TOP 4 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Collected revenue (Dark High-Contrast Card) */}
        <div className="dashboard-kpi dashboard-kpi-revenue p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600 text-xs">
            <span>Collected revenue</span>
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-blue-700 shadow-sm">
              <span className="text-[10px] font-bold">KES</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold tracking-tight text-[#17365f]">
              {formatKsh(stats.totalRevenue)}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="text-slate-600 text-[11px]">Paid sales collected today</span>
            </div>
          </div>
        </div>

        {/* Card 2: Vehicles detected */}
        <div className="dashboard-kpi dashboard-surface p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Vehicles detected</span>
            <Car className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold tracking-tight text-slate-900">
              {stats.vehiclesToday}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="text-slate-400 text-[11px]">Detected today</span>
            </div>
          </div>
        </div>

        {/* Card 3: Completed sales */}
        <div className="dashboard-kpi dashboard-surface p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Completed sales</span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold tracking-tight text-slate-900">
              {stats.completedSales}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="bg-emerald-50 text-emerald-700 font-bold text-[11px] px-2 py-0.5 rounded-md">
                {stats.conversionRate}%
              </span>
              <span className="text-slate-400 text-[11px]">arrival-to-sale conversion</span>
            </div>
          </div>
        </div>

        {/* Card 4: Average ticket */}
        <div className="dashboard-kpi dashboard-surface p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Average ticket</span>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold tracking-tight text-slate-900">
              {formatKsh(stats.averageTransaction)}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="text-slate-400 text-[11px]">Per completed sale</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle captures */}
      <div className="grid grid-cols-1 gap-5 items-stretch">
        {/* Live Wash Floor (Dark Hero Card) */}
        <div className="dashboard-floor p-5 sm:p-6 flex flex-col justify-between">
          <div>
            {/* Floor Header */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Vehicle captures
                  </h2>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{isSupabaseConnected ? 'ESP32-CAM Live' : 'Database offline'}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Latest ESP32-CAM images and detected vehicle classes
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-white border border-[#d5e5f5] px-3 py-1 rounded-full text-xs font-semibold text-slate-700 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>{captureCount} recent captures</span>
              </div>
            </div>

            {/* Recent ESP32-CAM captures */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              {captures.map((capture) => {
                const classConfig = getVehicleClassConfig(capture.vehicleClass);
                const ClassIcon = classConfig.icon;

                return (
                  <div
                    key={capture.id}
                    className="rounded-2xl p-3 flex flex-col justify-between border bg-white border-[#d7e5f4] shadow-sm transition-all hover:shadow-md"
                  >
                    <div>
                      <div className="text-[11px] font-medium text-slate-500 mb-2.5">
                        {new Date(capture.timestamp).toLocaleString()}
                      </div>

                      {/* Captured Image from ESP32-CAM */}
                      <div
                        onClick={() => capture.imageUrl && setPreviewCapture(capture)}
                        className="relative w-full h-28 sm:h-32 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 group cursor-pointer shadow-inner flex items-center justify-center"
                      >
                        {capture.imageUrl ? (
                          <>
                            <img
                              src={capture.imageUrl}
                              alt={classConfig.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-80 group-hover:opacity-90 transition-opacity" />

                            {/* Top overlay badges */}
                            <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[9px] font-bold text-white uppercase tracking-wider">
                              <Camera className="w-2.5 h-2.5 text-cyan-400" />
                              <span>ESP32-CAM</span>
                            </div>

                            {/* Hover zoom prompt */}
                            <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/90 text-slate-800 text-[10px] font-bold shadow-sm">
                              <ZoomIn className="w-3 h-3" />
                              <span>View</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 p-2">
                            <Camera className="w-7 h-7 text-slate-500 mb-1" />
                            <span className="text-[10px] font-semibold text-slate-400">Awaiting capture</span>
                          </div>
                        )}
                      </div>

                      {/* Detected vehicle class */}
                      <div className="text-center mt-3">
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black uppercase tracking-wider shadow-2xs ${classConfig.badgeBg} ${classConfig.textColor} ${classConfig.badgeBorder}`}
                        >
                          <ClassIcon className="w-3.5 h-3.5 stroke-[2.2]" />
                          <span>{classConfig.name}</span>
                        </div>

                        <div className="text-[11px] font-medium text-slate-500 truncate mt-1">{capture.id}</div>
                      </div>
                    </div>

                  </div>
                );
              })}
              {captures.length === 0 && (
                <p className="col-span-full py-8 text-center text-xs text-slate-500">
                  No captures are visible to this app. Check vehicle_captures rows and vehicles-images bucket list/read access for the app key.
                </p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* BOTTOM ROW: Revenue Overview (4 Cols) + Recent Sales (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Revenue Overview Chart (4 Cols) */}
        <div className="lg:col-span-5 dashboard-surface p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Revenue overview</h2>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              {formatKsh(stats.totalRevenue)}
            </div>
            <div className="flex items-center gap-2 text-xs mt-1 text-slate-500">
              <span>Collected across completed sales</span>
            </div>

            <div className="mt-7 mb-4 space-y-4">
              {paymentMethods.map((method) => {
                const share = stats.totalRevenue > 0 ? Math.round((method.amount / stats.totalRevenue) * 100) : 0;
                return (
                  <div key={method.label}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{method.label}</span>
                      <span className="tabular-nums text-slate-500">{formatKsh(method.amount)} · {share}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${method.color}`} style={{ width: `${share}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Payment mix</span>
            <span>Paid sales only</span>
          </div>
        </div>

        {/* Recent Sales Table (7 or 8 Cols) */}
        <div className="lg:col-span-7 dashboard-surface p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Recent sales</h2>
                <p className="text-xs text-slate-400 mt-0.5">Latest completed checkouts</p>
              </div>

              <button
                onClick={() => setActiveTab('transactions')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>View all transactions →</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                    <th className="pb-2.5">VEHICLE</th>
                    <th className="pb-2.5">SERVICE</th>
                    <th className="pb-2.5">PAID AT</th>
                    <th className="pb-2.5">PAYMENT</th>
                    <th className="pb-2.5 text-right">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {visibleTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      onClick={() => setSelectedReceipt(tx)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3">
                        <div className="font-mono font-bold text-slate-900">{tx.vehiclePlate}</div>
                        <div className="text-[10px] text-slate-400">{tx.vehicleType}</div>
                      </td>

                      <td className="py-3 text-slate-700">
                        {tx.services.map((s) => s.name).join(', ')}
                      </td>

                      <td className="py-3 text-slate-500 font-mono text-[11px]">
                        {tx.timestamp}
                      </td>

                      <td className="py-3">
                        <span className="flex items-center gap-1.5 text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{tx.paymentMethod}</span>
                        </span>
                      </td>

                      <td className="py-3 text-right">
                        <span className="font-bold text-slate-900 font-mono">
                          KSh {tx.total.toLocaleString()}
                        </span>
                        <ArrowUpRight className="w-3 h-3 text-slate-400 inline ml-1" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer info */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Showing {visibleTransactions.length} of {stats.completedSales} completed sales</span>
            <span className="text-emerald-700 font-medium">All payments reconciled</span>
          </div>
        </div>
      </div>

      {/* BOTTOM FOOTER STATUS STRIP */}
      <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>All activity synced</span>
        </div>

        <div className="font-medium text-slate-500">
          {stats.vehiclesToday} vehicle captures
        </div>

        <div>{settings.branch}</div>
      </div>

      {/* Preview Modal for ESP32-CAM Captured Image */}
      {previewCapture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  ESP32-CAM Capture
                </h3>
              </div>
              <button
                onClick={() => setPreviewCapture(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4">
              <div className="w-full max-h-[360px] rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center p-2">
                <img
                  src={previewCapture.imageUrl}
                  alt={String(previewCapture.vehicleClass)}
                  className="max-h-[340px] w-auto object-contain rounded-lg"
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detected Class</span>
                  <div className="text-base font-black text-slate-900 mt-0.5">
                    {previewCapture.vehicleClass}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Capture ID</span>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">
                    {previewCapture.id}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Captured At</span>
                  <div className="text-sm font-bold text-slate-800 mt-0.5 truncate">
                    {new Date(previewCapture.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
