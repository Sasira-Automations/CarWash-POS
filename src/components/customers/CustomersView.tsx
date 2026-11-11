import React, { useState } from 'react';
import {
  Users,
  Search,
  Phone,
  Award,
  ArrowUpRight
} from 'lucide-react';
import { useWashFlow } from '../../context/WashFlowContext';

export const CustomersView: React.FC = () => {
  const { customers, settings, quickChargePlateInPOS } = useWashFlow();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.plateNumber.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Customer Directory & Loyalty
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track frequent vehicle visitors, lifetime value, and phone numbers for M-Pesa receipts.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, plate, or phone..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((customer) => (
          <div
            key={customer.id}
            className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {customer.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{customer.phone}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    customer.tier === 'VIP'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : customer.tier === 'Gold'
                      ? 'bg-yellow-100 text-yellow-900 border border-yellow-300'
                      : customer.tier === 'Silver'
                      ? 'bg-slate-200 text-slate-800'
                      : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  <Award className="w-3 h-3" />
                  {customer.tier}
                </span>
              </div>

              {/* Plate pill */}
              <div className="mt-3.5 flex items-center gap-2">
                <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-300">
                  {customer.plateNumber}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-600 font-medium">
                  Fav: {customer.preferredService}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Visits / Spend
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {customer.totalVisits} visits • {settings.currency} {customer.totalSpent.toLocaleString()}
                </span>
              </div>

              <button
                onClick={() => quickChargePlateInPOS(customer.plateNumber)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white transition-all flex items-center gap-1"
              >
                <span>Charge</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
