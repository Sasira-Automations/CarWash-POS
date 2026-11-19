import React, { useState } from 'react';
import {
  Users,
  Search,
  Phone,
  Award,
  Plus,
  X
} from 'lucide-react';
import { useWashFlow } from '../../context/WashFlowContext';

export const CustomersView: React.FC = () => {
  const { customers, settings, addCustomer } = useWashFlow();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [preferredService, setPreferredService] = useState('');

  const filtered = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.plateNumber.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  const handleAddCustomer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      plateNumber: plateNumber.trim().toUpperCase(),
      preferredService: preferredService.trim() || 'Not set'
    });
    setName('');
    setPhone('');
    setPlateNumber('');
    setPreferredService('');
    setIsAddDialogOpen(false);
  };

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

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
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
          <button
            type="button"
            onClick={() => setIsAddDialogOpen(true)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <Plus className="h-4 w-4" />
            Add customer
          </button>
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <p className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
            {customers.length === 0 ? 'No customers have been added yet.' : 'No customers match your search.'}
          </p>
        )}
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

            </div>
          </div>
        ))}
      </div>

      {isAddDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-3 sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsAddDialogOpen(false);
          }}
        >
          <form
            onSubmit={handleAddCustomer}
            className="w-full max-w-md rounded-2xl bg-white p-4 sm:p-5 shadow-2xl max-h-[92vh] overflow-y-auto"
            aria-labelledby="add-customer-title"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 id="add-customer-title" className="text-base font-extrabold text-slate-900">Add customer</h3>
                <p className="mt-1 text-xs text-slate-500">Create a customer directory record.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDialogOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Name
                <input required autoFocus value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500" />
              </label>
              <label className="block text-xs font-semibold text-slate-700">
                Phone
                <input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500" />
              </label>
              <label className="block text-xs font-semibold text-slate-700">
                Vehicle plate
                <input required value={plateNumber} onChange={(event) => setPlateNumber(event.target.value.toUpperCase())} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm font-normal uppercase outline-none focus:border-blue-500" />
              </label>
              <label className="block text-xs font-semibold text-slate-700">
                Preferred service <span className="font-normal text-slate-400">(optional)</span>
                <input value={preferredService} onChange={(event) => setPreferredService(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500" />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setIsAddDialogOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                Save customer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
