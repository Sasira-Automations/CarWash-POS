import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  DollarSign,
  Smartphone,
  Banknote,
  CreditCard,
  Plus,
  Minus
} from 'lucide-react';
import { useWashFlow } from '../../context/WashFlowContext';
import { PaymentMethod, VehicleClass } from '../../types';

interface RecordSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  preFill?: {
    plateNumber?: string;
    vehicleClass?: VehicleClass | string;
    detectionId?: string;
  };
}

export const RecordSaleModal: React.FC<RecordSaleModalProps> = ({
  isOpen,
  onClose,
  preFill
}) => {
  const { services, addTransaction, settings, setSelectedReceipt, showToast } = useWashFlow();

  const [plate, setPlate] = useState(preFill?.plateNumber || '');
  const [vehicleType, setVehicleType] = useState<string>(preFill?.vehicleClass || 'Car');
  const [attendantName, setAttendantName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('M-Pesa');
  const [mpesaRef, setMpesaRef] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [cashTendered, setCashTendered] = useState<string>('');

  // Selected services: map of serviceId -> quantity
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});

  if (!isOpen) return null;

  const toggleService = (srvId: string) => {
    setSelectedServices((prev) => {
      const next = { ...prev };
      if (next[srvId]) {
        delete next[srvId];
      } else {
        next[srvId] = 1;
      }
      return next;
    });
  };

  const updateQuantity = (srvId: string, delta: number) => {
    setSelectedServices((prev) => {
      const current = prev[srvId] || 0;
      const nextQty = current + delta;
      const next = { ...prev };
      if (nextQty <= 0) {
        delete next[srvId];
      } else {
        next[srvId] = nextQty;
      }
      return next;
    });
  };

  // Calculations
  const serviceList = Object.entries(selectedServices)
    .map(([srvId, quantity]) => {
      const srv = services.find((s) => s.id === srvId);
      if (!srv) return null;
      return {
        serviceId: srv.id,
        name: srv.name,
        price: srv.price,
        quantity
      };
    })
    .filter(Boolean) as { serviceId: string; name: string; price: number; quantity: number }[];

  const subtotal = serviceList.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const finalDiscount = Math.max(0, Math.min(subtotal, discount || 0));
  const totalDue = Math.max(0, subtotal - finalDiscount);

  const tendered = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tendered - totalDue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (serviceList.length === 0) {
      showToast('Please select at least one wash service');
      return;
    }

    const finalPlate = (plate || 'UNLISTED').toUpperCase().trim();

    const newTx = addTransaction({
      vehiclePlate: finalPlate,
      vehicleType: vehicleType || 'Car',
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      services: serviceList,
      discount: finalDiscount,
      paymentMethod,
      attendantName: attendantName.trim() || 'Staff Attendant',
      mpesaRef: paymentMethod === 'M-Pesa' ? mpesaRef.trim().toUpperCase() : undefined,
      detectionId: preFill?.detectionId
    });

    onClose();
    setSelectedReceipt(newTx);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full max-h-[94vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Record POS Checkout
              </h3>
              <p className="text-xs text-slate-500">Bill vehicle entry & issue receipt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Vehicle Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vehicle Plate Number
              </label>
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="e.g. KDA 820H"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-xs uppercase text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vehicle Class
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="Car">Car / Sedan / SUV</option>
                <option value="Truck">Truck / Pickup / Lorry</option>
                <option value="Bus">Bus / Matatu</option>
                <option value="Motorcycle">Motorcycle / Boda</option>
              </select>
            </div>
          </div>

          {/* Attendant & Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Attendant Name
              </label>
              <input
                type="text"
                value={attendantName}
                onChange={(e) => setAttendantName(e.target.value)}
                placeholder="Staff Member"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Customer Name (Optional)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. John Kamau"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Customer Tel (Optional)
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="07XX XXX XXX"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Services Catalog Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Select Wash Packages & Services
              </label>
              <span className="text-[11px] text-blue-600 font-semibold">
                {serviceList.length} selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-2xl bg-slate-50/50">
              {services.map((srv) => {
                const isSelected = Boolean(selectedServices[srv.id]);
                const qty = selectedServices[srv.id] || 0;

                return (
                  <div
                    key={srv.id}
                    className={`p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-300 shadow-xs'
                        : 'bg-white border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className="flex-1 cursor-pointer min-w-0"
                      onClick={() => toggleService(srv.id)}
                    >
                      <div className="font-bold text-slate-900 truncate">{srv.name}</div>
                      <div className="text-[11px] font-extrabold text-blue-700">
                        {settings.currency} {srv.price.toLocaleString()}
                      </div>
                    </div>

                    {isSelected ? (
                      <div className="flex items-center gap-1.5 shrink-0 bg-white px-1.5 py-0.5 rounded-lg border border-blue-200">
                        <button
                          type="button"
                          onClick={() => updateQuantity(srv.id, -1)}
                          className="w-5 h-5 flex items-center justify-center rounded text-slate-600 hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-xs w-4 text-center text-slate-900">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(srv.id, 1)}
                          className="w-5 h-5 flex items-center justify-center rounded text-slate-600 hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleService(srv.id)}
                        className="px-2 py-1 rounded-lg text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200"
                      >
                        Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('M-Pesa')}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === 'M-Pesa'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm ring-1 ring-emerald-400'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>M-Pesa</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Cash')}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === 'Cash'
                    ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-sm ring-1 ring-blue-400'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-3.5 h-3.5 text-blue-600" />
                <span>Cash Drawer</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Card')}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === 'Card'
                    ? 'bg-violet-50 border-violet-300 text-violet-800 shadow-sm ring-1 ring-violet-400'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-violet-600" />
                <span>Card POS</span>
              </button>
            </div>

            {/* M-Pesa Code Input */}
            {paymentMethod === 'M-Pesa' && (
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    M-Pesa Confirmation Ref:
                  </label>
                  <input
                    type="text"
                    value={mpesaRef}
                    onChange={(e) => setMpesaRef(e.target.value.toUpperCase())}
                    placeholder="e.g. QAK4920482"
                    required
                    className="mt-1 w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg font-mono font-bold text-xs text-emerald-950 focus:outline-none"
                  />
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold shrink-0">
                  {settings.mpesaTillNumber ? `Till: ${settings.mpesaTillNumber}` : 'Set Till in Settings'}
                </div>
              </div>
            )}

            {/* Cash Tendered Input */}
            {paymentMethod === 'Cash' && (
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-blue-800">
                    Cash Tendered ({settings.currency}):
                  </label>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder={totalDue.toString()}
                    className="mt-1 w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg font-bold text-xs text-blue-950 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-blue-800">
                    Change Due:
                  </label>
                  <div className="mt-1 px-2.5 py-1.5 bg-white/80 border border-blue-200 rounded-lg font-mono font-extrabold text-xs text-emerald-700">
                    {settings.currency} {changeDue.toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Discount & Calculations Strip */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Services Subtotal:</span>
              <span className="font-bold text-slate-900">
                {settings.currency} {subtotal.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600">Discount ({settings.currency}):</span>
              <input
                type="number"
                min="0"
                max={subtotal}
                value={discount || ''}
                onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="0"
                className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg text-right font-bold text-xs text-slate-800 focus:outline-none"
              />
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
              <span className="font-extrabold text-slate-900">TOTAL DUE & RECONCILED:</span>
              <span className="font-mono font-black text-base text-blue-700">
                {settings.currency} {totalDue.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={totalDue <= 0 && serviceList.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.01]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Complete Sale & Issue Receipt ({settings.currency} {totalDue.toLocaleString()})</span>
          </button>
        </form>
      </div>
    </div>
  );
};
