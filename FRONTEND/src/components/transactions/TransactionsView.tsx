import React, { useState } from 'react';
import {
  ReceiptText,
  Search,
  Download,
  Receipt,
  Smartphone,
  Banknote,
  CreditCard,
  RotateCcw,
  Plus
} from 'lucide-react';
import { useWashFlow } from '../../context/WashFlowContext';
import { PaymentMethod, TransactionStatus } from '../../types';

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    settings,
    setSelectedReceipt,
    refundTransaction,
    openRecordSaleModal,
    showToast
  } = useWashFlow();

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'All' | PaymentMethod>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | TransactionStatus>('All');

  const filteredTransactions = transactions.filter((t) => {
    if (methodFilter !== 'All' && t.paymentMethod !== methodFilter) return false;
    if (statusFilter !== 'All' && t.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.receiptNumber.toLowerCase().includes(q) ||
        t.vehiclePlate.toLowerCase().includes(q) ||
        (t.customerName && t.customerName.toLowerCase().includes(q)) ||
        (t.customerPhone && t.customerPhone.includes(q)) ||
        (t.mpesaRef && t.mpesaRef.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalFilteredRevenue = filteredTransactions
    .filter((t) => t.status === 'Completed')
    .reduce((sum, t) => sum + t.total, 0);

  const completedCount = filteredTransactions.filter((t) => t.status === 'Completed').length;
  const refundedTransactions = filteredTransactions.filter((t) => t.status === 'Refunded');
  const refundedCount = refundedTransactions.length;
  const refundedTotal = refundedTransactions.reduce((sum, t) => sum + t.total, 0);

  const avgTicket = completedCount > 0 ? Math.round(totalFilteredRevenue / completedCount) : 0;

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Receipt,Plate,VehicleType,Services,PaymentMethod,Subtotal,Discount,Total,Status,Timestamp,MpesaRef,Attendant\n' +
      filteredTransactions
        .map(
          (t) =>
            `"${t.receiptNumber}","${t.vehiclePlate}","${t.vehicleType}","${t.services.map((s) => s.name).join(';')}",${t.paymentMethod},${t.subtotal},${t.discount},${t.total},${t.status},"${t.timestamp}","${t.mpesaRef || ''}","${t.attendantName}"`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `washflow_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported transactions CSV');
  };

  const formatDisplayTime = (isoOrFormatted: string) => {
    try {
      const d = new Date(isoOrFormatted);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (e) {
      // fallback
    }
    return isoOrFormatted;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Transaction Ledger & POS History
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Auditable sales records, customer receipts, and reconciliation for cash drawers and M-Pesa till.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => openRecordSaleModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Sale</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-all"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm">
          <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
            Recorded Net Sales Revenue
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-1 sm:mt-2">
            {settings.currency} {totalFilteredRevenue.toLocaleString()}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1">
            From {completedCount} completed sales
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm">
          <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
            Completed Transactions
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 sm:mt-2">
            {completedCount} Sales
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1">
            Avg ticket: {settings.currency} {avgTicket.toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm">
          <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
            Refunds & Reversals
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-600 mt-1 sm:mt-2">
            {refundedCount} ({settings.currency} {refundedTotal.toLocaleString()})
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1">
            Audited refund deductions
          </div>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-sm space-y-4 sm:space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          {/* Method filters */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 bg-slate-100/80 p-1 rounded-2xl text-xs font-semibold">
            {(['All', 'M-Pesa', 'Cash', 'Card'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  methodFilter === m
                    ? 'bg-white text-blue-600 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Status filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Refunded">Refunded</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search plate, receipt, phone..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Mobile Cards View (md:hidden) */}
        <div className="md:hidden space-y-3">
          {filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-2.5 transition-all hover:bg-slate-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-600 text-xs">
                    {tx.receiptNumber}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      tx.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : tx.status === 'Refunded'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {tx.status}
                  </span>
                </div>
                <div className="font-extrabold text-slate-900 text-sm">
                  {settings.currency} {tx.total.toLocaleString()}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-mono font-extrabold text-xs px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-300">
                  {tx.vehiclePlate}
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-slate-700">
                  {tx.paymentMethod === 'M-Pesa' && <Smartphone className="w-3.5 h-3.5 text-emerald-600" />}
                  {tx.paymentMethod === 'Cash' && <Banknote className="w-3.5 h-3.5 text-blue-600" />}
                  {tx.paymentMethod === 'Card' && <CreditCard className="w-3.5 h-3.5 text-indigo-600" />}
                  {tx.paymentMethod}
                </span>
              </div>

              <div className="text-xs text-slate-600 font-medium truncate">
                {tx.services.map((s) => s.name).join(', ')}
              </div>

              {tx.mpesaRef && (
                <div className="text-[11px] text-slate-500 font-mono">
                  Ref: <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{tx.mpesaRef}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs text-slate-400">
                <span>{formatDisplayTime(tx.timestamp)}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedReceipt(tx)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Receipt</span>
                  </button>
                  {tx.status === 'Completed' && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Issue refund for ${tx.receiptNumber}?`)) {
                          refundTransaction(tx.id);
                        }
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Issue Refund"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredTransactions.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <ReceiptText className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No transactions match your search criteria.</p>
            </div>
          )}
        </div>

        {/* Desktop Table (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                <th className="pb-3">Receipt #</th>
                <th className="pb-3">Plate</th>
                <th className="pb-3">Services</th>
                <th className="pb-3">Payment</th>
                <th className="pb-3">Attendant</th>
                <th className="pb-3">Date/Time</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Amount</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 font-mono font-bold text-blue-600">
                    {tx.receiptNumber}
                  </td>
                  <td className="py-3.5">
                    <span className="font-mono font-extrabold text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300">
                      {tx.vehiclePlate}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-700 max-w-[220px]">
                    <div className="truncate font-semibold">{tx.services.map((s) => s.name).join(', ')}</div>
                    {tx.discount > 0 && (
                      <span className="text-[10px] text-emerald-600 font-bold">
                        Discount: -{settings.currency} {tx.discount}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      {tx.paymentMethod === 'M-Pesa' && <Smartphone className="w-3.5 h-3.5 text-emerald-600" />}
                      {tx.paymentMethod === 'Cash' && <Banknote className="w-3.5 h-3.5 text-blue-600" />}
                      {tx.paymentMethod === 'Card' && <CreditCard className="w-3.5 h-3.5 text-violet-600" />}
                      <span>{tx.paymentMethod}</span>
                    </div>
                    {tx.mpesaRef && (
                      <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                        Ref: {tx.mpesaRef}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 text-slate-600">{tx.attendantName}</td>
                  <td className="py-3.5 text-slate-500 font-mono text-[11px]">
                    {formatDisplayTime(tx.timestamp)}
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : tx.status === 'Refunded'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-right font-mono font-extrabold text-slate-900 text-xs">
                    {settings.currency} {tx.total.toLocaleString()}
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedReceipt(tx)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 transition-colors shadow-2xs"
                      >
                        Receipt
                      </button>
                      {tx.status === 'Completed' && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Issue refund for ${tx.receiptNumber}?`)) {
                              refundTransaction(tx.id);
                            }
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Issue Refund"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-slate-400">
                    No transactions match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
