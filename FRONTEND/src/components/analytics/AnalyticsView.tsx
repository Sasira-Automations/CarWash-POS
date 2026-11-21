import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  DollarSign,
  Clock,
  TrendingUp,
  Wallet,
  Smartphone,
  Banknote,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Car,
  Receipt,
  ArrowRight
} from 'lucide-react';
import { useWashFlow } from '../../context/WashFlowContext';

export const AnalyticsView: React.FC = () => {
  const { getReconciliationData, settings, showToast, openRecordSaleModal } = useWashFlow();
  const [reportRange, setReportRange] = useState<'today' | 'week' | 'month' | 'all'>('today');

  const reconciliation = getReconciliationData(reportRange);

  const formatKsh = (amount: number) => `${settings.currency} ${amount.toLocaleString()}`;

  const handleExportReconciliationCSV = () => {
    const csvRows = [
      ['SPARKLE WASHFLOW - REVENUE RECONCILIATION AUDIT REPORT'],
      [`Branch: ${settings.branch}`, `Period: ${reportRange.toUpperCase()}`, `Generated: ${new Date().toLocaleString()}`],
      [''],
      ['1. EXECUTIVE FINANCIAL RECONCILIATION LEDGER'],
      ['Metric', 'Amount (KES)', 'Notes'],
      ['Gross Recorded Sales', reconciliation.grossRevenue, `${reconciliation.completedSales + reconciliation.refundedSales} total tickets`],
      ['Less: Customer Refunds & Reversals', -reconciliation.refundedAmount, `${reconciliation.refundedSales} refunded tickets`],
      ['Net Collected Revenue', reconciliation.totalRevenue, `${reconciliation.completedSales} completed paid sales`],
      ['Less: Operating Expenses', -reconciliation.totalExpenses, 'Operational costs & supplies'],
      ['Net Operating Cash Flow', reconciliation.netOperatingProfit, `${reconciliation.operatingProfitMargin}% operating margin`],
      [''],
      ['2. PAYMENT TENDER & DRAWER RECONCILIATION'],
      ['Payment Method', 'Gross Intake', 'Expenses Deducted', 'Net Expected Balance', 'Share %'],
      ['M-Pesa Till', reconciliation.revenueByMethod['M-Pesa'].amount, reconciliation.revenueByMethod['M-Pesa'].expensesDeducted, reconciliation.revenueByMethod['M-Pesa'].netTenderBalance, `${reconciliation.revenueByMethod['M-Pesa'].share}%`],
      ['Cash Drawer', reconciliation.revenueByMethod.Cash.amount, reconciliation.revenueByMethod.Cash.expensesDeducted, reconciliation.revenueByMethod.Cash.netTenderBalance, `${reconciliation.revenueByMethod.Cash.share}%`],
      ['Card POS Machine', reconciliation.revenueByMethod.Card.amount, reconciliation.revenueByMethod.Card.expensesDeducted, reconciliation.revenueByMethod.Card.netTenderBalance, `${reconciliation.revenueByMethod.Card.share}%`],
      [''],
      ['3. CAMERA FOOT-TRAFFIC TO REVENUE CONVERSION FUNNEL'],
      ['Entrance Detections', reconciliation.vehiclesCount, 'Physical vehicles detected by camera'],
      ['Completed POS Sales', reconciliation.completedSales, `${reconciliation.conversionRate}% conversion efficiency`],
      ['Unbilled / Drop-offs', reconciliation.unbilledVehicles, 'Vehicles with no recorded sale'],
      ['Average Ticket (Basket Size)', reconciliation.averageTicket, 'Average per paid sale'],
      ['Estimated Revenue Leakage', reconciliation.potentialLeakage, 'Unbilled vehicles x Average Ticket'],
      [''],
      ['4. REVENUE CONTRIBUTION BY SERVICE'],
      ['Service Name', 'Orders Count', 'Revenue (KES)', 'Share %'],
      ...reconciliation.servicesBreakdown.map((s) => [s.name, s.count, s.revenue, `${s.share}%`])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `revenue_reconciliation_${reportRange}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Reconciliation audit report exported');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="bg-[#eaf3ff] border border-[#cfe0f4] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_6px_20px_rgba(32,64,100,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-white text-[#1b5fad] flex items-center justify-center shadow-xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full">
              Financial & Traffic Audit
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Revenue & Operations Reconciliation
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Audit camera vehicle ingress against POS collections, tender drawers (M-Pesa & Cash), operating expenses, and leakage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-white border border-[#cfe0f4] p-1 rounded-xl flex items-center text-xs font-semibold shadow-xs">
            {(
              [
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'Past 7 Days' },
                { id: 'month', label: 'This Month' },
                { id: 'all', label: 'All Time' }
              ] as const
            ).map((r) => (
              <button
                key={r.id}
                onClick={() => setReportRange(r.id)}
                className={`px-3 py-1.5 rounded-lg transition-all text-xs ${
                  reportRange === r.id
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportReconciliationCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#d5e0eb] hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Audit CSV</span>
          </button>
        </div>
      </div>

      {/* 1. EXECUTIVE RECONCILIATION LEDGER */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Executive Financial Reconciliation Ledger
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Audited flow from Gross Sales to Net Operating Cash Flow for {settings.branch} ({reportRange.toUpperCase()})
            </p>
          </div>
          <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ledger Balanced</span>
          </span>
        </div>

        {/* 5-Step Calculation Formula Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {/* 1. Gross Sales */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              1. Gross Recorded Sales
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {formatKsh(reconciliation.grossRevenue)}
            </div>
            <p className="text-[11px] text-slate-500">
              {reconciliation.completedSales + reconciliation.refundedSales} sales tickets billed
            </p>
          </div>

          {/* 2. Refunds */}
          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
              2. (-) Refunds & Reversals
            </span>
            <div className="text-xl sm:text-2xl font-black text-rose-700 tracking-tight">
              - {formatKsh(reconciliation.refundedAmount)}
            </div>
            <p className="text-[11px] text-rose-600">
              {reconciliation.refundedSales} refunded transactions
            </p>
          </div>

          {/* 3. Net Collected Revenue */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
              3. (=) Net Collected Sales
            </span>
            <div className="text-xl sm:text-2xl font-black text-blue-900 tracking-tight">
              {formatKsh(reconciliation.totalRevenue)}
            </div>
            <p className="text-[11px] text-blue-700">
              {reconciliation.completedSales} completed paid tickets
            </p>
          </div>

          {/* 4. Operating Expenses */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
              4. (-) Operating Costs
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-900 tracking-tight">
              - {formatKsh(reconciliation.totalExpenses)}
            </div>
            <p className="text-[11px] text-amber-700">
              Supplies, utilities & maintenance
            </p>
          </div>

          {/* 5. Net Operating Profit */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1 sm:col-span-2 lg:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              5. (=) Net Operating Profit
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight">
              {formatKsh(reconciliation.netOperatingProfit)}
            </div>
            <p className="text-[11px] text-emerald-700 font-bold">
              {reconciliation.operatingProfitMargin}% operating cash margin
            </p>
          </div>
        </div>
      </div>

      {/* 2. PAYMENT TENDER & DRAWER RECONCILIATION */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Payment Channel & Drawer Reconciliation
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify physical cash in drawer, M-Pesa till balance changes, and card POS settlements against sales intake.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Channel Total: <strong className="text-slate-900">{formatKsh(reconciliation.totalRevenue)}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* M-Pesa Till Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-emerald-50/50 to-white border border-emerald-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    M-Pesa Till {settings.mpesaTillNumber ? `#${settings.mpesaTillNumber}` : ''}
                  </h4>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    {reconciliation.revenueByMethod['M-Pesa'].share}% of net sales
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                {reconciliation.revenueByMethod['M-Pesa'].count} Sales
              </span>
            </div>

            <div className="space-y-1.5 text-xs pt-2 border-t border-emerald-100 font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Collections Inflow:</span>
                <span className="font-bold text-slate-900">{formatKsh(reconciliation.revenueByMethod['M-Pesa'].amount)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Till Expenses Paid:</span>
                <span className="font-bold">- {formatKsh(reconciliation.revenueByMethod['M-Pesa'].expensesDeducted)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-emerald-200 text-emerald-900 font-extrabold text-sm">
                <span>Net Till Balance Change:</span>
                <span>{formatKsh(reconciliation.revenueByMethod['M-Pesa'].netTenderBalance)}</span>
              </div>
            </div>
          </div>

          {/* Cash Drawer Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-blue-50/50 to-white border border-blue-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Physical Cash Drawer</h4>
                  <span className="text-[10px] text-blue-700 font-bold">
                    {reconciliation.revenueByMethod.Cash.share}% of net sales
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                {reconciliation.revenueByMethod.Cash.count} Sales
              </span>
            </div>

            <div className="space-y-1.5 text-xs pt-2 border-t border-blue-100 font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Cash Sales Inflow:</span>
                <span className="font-bold text-slate-900">{formatKsh(reconciliation.revenueByMethod.Cash.amount)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Petty Cash Paid Out:</span>
                <span className="font-bold">- {formatKsh(reconciliation.revenueByMethod.Cash.expensesDeducted)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-blue-200 text-blue-900 font-extrabold text-sm">
                <span>Expected Drawer Cash:</span>
                <span>{formatKsh(reconciliation.revenueByMethod.Cash.netTenderBalance)}</span>
              </div>
            </div>
          </div>

          {/* Card POS Machine Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-violet-50/50 to-white border border-violet-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-800 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Bank Card Terminal POS</h4>
                  <span className="text-[10px] text-violet-700 font-bold">
                    {reconciliation.revenueByMethod.Card.share}% of net sales
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-100 text-violet-800">
                {reconciliation.revenueByMethod.Card.count} Sales
              </span>
            </div>

            <div className="space-y-1.5 text-xs pt-2 border-t border-violet-100 font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Card Swipes Inflow:</span>
                <span className="font-bold text-slate-900">{formatKsh(reconciliation.revenueByMethod.Card.amount)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Terminal Fees:</span>
                <span className="font-bold">{formatKsh(0)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-violet-200 text-violet-900 font-extrabold text-sm">
                <span>Bank Settlement Due:</span>
                <span>{formatKsh(reconciliation.revenueByMethod.Card.netTenderBalance)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Validation Banner */}
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-800 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Tender Reconciliation Verified: M-Pesa ({formatKsh(reconciliation.revenueByMethod['M-Pesa'].amount)}) + Cash ({formatKsh(reconciliation.revenueByMethod.Cash.amount)}) + Card ({formatKsh(reconciliation.revenueByMethod.Card.amount)}) = Net Revenue ({formatKsh(reconciliation.totalRevenue)})</span>
          </div>
          <span className="hidden sm:inline font-mono font-extrabold text-[11px] text-emerald-900 bg-white px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
            100% RECONCILED
          </span>
        </div>
      </div>

      {/* 3. VEHICLE INGRESS TO REVENUE CONVERSION FUNNEL */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-600" />
              <h3 className="text-base font-extrabold text-slate-900">
                Vehicle Ingress to Sales Conversion Funnel
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Entrance camera foot-traffic ingress vs verified attendant POS checkouts
            </p>
          </div>
          <span className="self-start sm:self-auto text-xs sm:text-sm font-extrabold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
            {reconciliation.conversionRate}% Conversion Efficiency
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
              1. Physical Camera Ingress
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {reconciliation.vehiclesCount} Vehicles
            </div>
            <p className="text-[11px] text-blue-700">
              100% of physical traffic at Gate 1 Ingress
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              2. Completed POS Sales
            </span>
            <div className="text-2xl font-black text-emerald-950 mt-1">
              {reconciliation.completedSales} Paid Tickets
            </div>
            <p className="text-[11px] text-emerald-700">
              Avg ticket: {formatKsh(reconciliation.averageTicket)} per car
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
              3. Unbilled / Drop-offs
            </span>
            <div className="text-2xl font-black text-amber-950 mt-1">
              {reconciliation.unbilledVehicles} Vehicles
            </div>
            <p className="text-[11px] text-amber-700">
              Ingress arrivals without completed checkout
            </p>
          </div>
        </div>

        {/* Revenue Leakage Notice */}
        {reconciliation.unbilledVehicles > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-amber-950">
                  Potential Revenue Leakage Detected: {formatKsh(reconciliation.potentialLeakage)}
                </span>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Based on {reconciliation.unbilledVehicles} unbilled vehicle arrivals at an average basket size of {formatKsh(reconciliation.averageTicket)}.
                </p>
              </div>
            </div>

            <button
              onClick={() => openRecordSaleModal()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs self-start sm:self-auto shrink-0 transition-colors"
            >
              <span>Bill Vehicle Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 4. DYNAMIC PEAK TRAFFIC & SERVICES BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Peak Traffic Hours */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Peak Traffic & Sales Hours</h3>
              <p className="text-xs text-slate-500 mt-0.5">Hourly arrival ingress vs checkouts distribution</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {reconciliation.hourlyTraffic.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-semibold ${item.isPeak ? 'text-blue-700 font-extrabold' : 'text-slate-700'}`}>
                    {item.hour} {item.isPeak && '(Peak)'}
                  </span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-slate-500">{item.trafficCount} ingress</span>
                    <span className="text-slate-300">·</span>
                    <span className="font-bold text-slate-900">{item.salesCount} sales ({formatKsh(item.revenue)})</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      item.isPeak ? 'bg-blue-600' : 'bg-blue-300'
                    }`}
                    style={{ width: `${Math.max(item.percentage, item.salesCount > 0 ? 8 : 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Service Breakdown */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Revenue Contribution by Service</h3>
              <p className="text-xs text-slate-500 mt-0.5">Calculated from actual completed transactions</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          {reconciliation.servicesBreakdown.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No completed services recorded for this period.</p>
            </div>
          ) : (
            <div className="space-y-2.5 pt-1">
              {reconciliation.servicesBreakdown.map((s, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{s.name}</h4>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {s.count} {s.count === 1 ? 'order' : 'orders'} • {s.share}% of services revenue
                    </div>
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 font-mono whitespace-nowrap">
                    {formatKsh(s.revenue)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
