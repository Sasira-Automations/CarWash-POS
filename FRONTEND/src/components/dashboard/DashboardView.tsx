import React from 'react';
import {
  Car,
  Receipt,
  BarChart3,
  ArrowUpRight,
  Check,
  Activity,
  Droplets
} from 'lucide-react';
import { useWashFlow } from '../../context/WashFlowContext';

export const DashboardView: React.FC = () => {
  const {
    washBays,
    detections,
    transactions,
    setActiveTab,
    setSelectedReceipt,
    settings,
    stats
  } = useWashFlow();

  const waitingArrivals = detections.filter((d) => d.waitingForSale);
  const washingBays = washBays.filter((bay) => bay.status === 'Washing').length;
  const readyBays = washBays.filter((bay) => bay.status === 'Ready').length;
  const occupiedBays = washBays.filter((bay) => bay.status !== 'Available').length;
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
              {settings.branch} <span className="mx-1.5 text-slate-500">/</span> Your arrivals, bays and recorded payments in one view.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-slate-950/35 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              {occupiedBays} of {washBays.length} bays active
            </div>
            <button
              onClick={() => setActiveTab('monitoring')}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 transition-colors hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              <Activity className="h-4 w-4" />
              Open wash floor
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

      {/* MIDDLE SECTION: Live Wash Floor (8 Cols) + Live Arrivals (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Live Wash Floor (Dark Hero Card) */}
        <div className="lg:col-span-8 dashboard-floor p-5 sm:p-6 flex flex-col justify-between">
          <div>
            {/* Floor Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Live wash floor
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  {washingBays} washing · {readyBays} ready for pickup
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-white border border-[#d5e5f5] px-3 py-1 rounded-full text-xs font-semibold text-slate-700">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>{occupiedBays} / {washBays.length} bays occupied</span>
              </div>
            </div>

            {/* 4 Bays Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              {washBays.map((bay) => {
                const isReady = bay.status === 'Ready';
                const progressPct = Math.min(100, Math.round((bay.elapsedMinutes / bay.totalEstimatedMinutes) * 100));

                return (
                  <div
                    key={bay.id}
                    className={`rounded-xl p-3.5 flex flex-col justify-between border transition-all ${
                      isReady
                        ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                        : 'bg-white border-[#d7e5f4] shadow-sm'
                    }`}
                  >
                    <div>
                      {/* Bay Number & Status */}
                      <div className="flex items-center justify-between text-[11px] font-semibold mb-3">
                        <span className={isReady ? 'text-emerald-700' : 'text-slate-500'}>
                          {bay.bayNumber}
                        </span>
                        <span className={isReady ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                          {bay.status}
                        </span>
                      </div>

                      {/* Car Graphic Icon */}
                      <div className="py-2 flex items-center justify-center">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            isReady ? 'bg-emerald-100 text-emerald-700' : 'bg-[#eaf3ff] text-[#3472b7]'
                          }`}
                        >
                          <Car className="w-6 h-6 stroke-[1.8]" />
                        </div>
                      </div>

                      {/* Plate Number & Service */}
                      <div className="text-center mt-2">
                        <div className="font-mono font-extrabold text-sm text-slate-900">
                          {bay.plateNumber}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {bay.service}
                        </div>
                      </div>
                    </div>

                    {/* Bay progress and readiness */}
                    <div className="mt-4 pt-2">
                      {isReady ? (
                        <div className="w-full py-2 text-center text-emerald-700 font-bold text-xs">
                          Ready for pickup
                        </div>
                      ) : (
                        <div>
                          <div className="w-full bg-[#d7e5f4] h-1 rounded-full overflow-hidden mb-2">
                            <div
                              className="bg-blue-500 h-full rounded-full transition-all"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-slate-600 text-center font-medium">
                            {String(bay.elapsedMinutes).padStart(2, '0')} min elapsed
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Arrivals (White Card, 4 Cols) */}
        <div className="lg:col-span-4 dashboard-surface p-5 sm:p-6 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Live arrivals</h2>
                <p className="text-xs text-slate-500">Sample entries · camera integration pending</p>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Demo</span>
              </div>
            </div>

            {/* Arrivals without a linked transaction */}
            <div className="bg-[#fffbeb] border border-[#fef3c7] text-[#92400e] text-xs font-medium px-3.5 py-2.5 rounded-xl mb-4">
              {waitingArrivals.length} {waitingArrivals.length === 1 ? 'arrival has' : 'arrivals have'} no linked transaction
            </div>

            {/* Arrivals List */}
            <div className="space-y-4">
              {waitingArrivals.slice(0, 2).map((det) => (
                <div
                  key={det.id}
                  className="pb-3 border-b border-slate-100 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-sm text-slate-900">
                          {det.plateNumber}
                        </span>
                        <span className="text-[11px] text-slate-400">{det.timestamp}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{det.vehicleType}</div>
                      <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>{det.confidence}% confidence</span>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
              {waitingArrivals.length === 0 && (
                <p className="py-5 text-center text-xs text-slate-400">No recent arrivals.</p>
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
          {stats.vehiclesToday} vehicles detected · {occupiedBays} bays active
        </div>

        <div>{settings.branch}</div>
      </div>
    </div>
  );
};
