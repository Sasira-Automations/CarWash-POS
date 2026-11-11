import React, { useState } from 'react';
import {
  Car,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Smartphone,
  Banknote,
  CreditCard,
  Sparkles,
  Clock,
  Tag,
  Zap,
  Phone
} from 'lucide-react';
import { useWashFlow } from '../../context/WashFlowContext';

export const POSView: React.FC = () => {
  const {
    services,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    posPlateInput,
    setPosPlateInput,
    posCustomerPhone,
    setPosCustomerPhone,
    posDiscount,
    setPosDiscount,
    posPaymentMethod,
    setPosPaymentMethod,
    completeSale,
    detections,
    settings,
    showToast
  } = useWashFlow();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cashTendered, setCashTendered] = useState<string>('');

  const categories = ['All', 'Washing', 'Interior', 'Detailing', 'Specialty'];

  const filteredServices = services.filter((s) => {
    if (!s.active) return false;
    if (selectedCategory === 'All') return true;
    return s.category === selectedCategory;
  });

  const subtotal = cart.reduce((acc, item) => acc + item.service.price * item.quantity, 0);
  const total = Math.max(0, subtotal - posDiscount);

  // Unserved detections that arrived via entrance camera
  const recentEntrancePlates = detections
    .filter((d) => !d.matchedTransactionId && !d.isDuplicate)
    .slice(0, 5);

  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - total);

  const handleCheckout = () => {
    if (cart.length === 0) {
      showToast('Select at least one service to complete sale');
      return;
    }
    completeSale();
    setCashTendered('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Quick Entrance Vehicle Selection */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Point of Sale Terminal
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Rapid checkout for attendants. Select vehicle plate, pick services, and record payment.
            </p>
          </div>

          {/* Quick-Pick from Entrance Camera */}
          {recentEntrancePlates.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 bg-blue-50/70 border border-blue-200/70 p-2.5 rounded-2xl">
              <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-blue-600" />
                Quick Pick (Entrance Cam):
              </span>
              {recentEntrancePlates.map((det) => (
                <button
                  key={det.id}
                  onClick={() => {
                    setPosPlateInput(det.plateNumber);
                    showToast(`Loaded ${det.plateNumber} from camera`);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                    posPlateInput === det.plateNumber
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-800 border border-slate-300 hover:border-blue-400'
                  }`}
                  title={`${det.vehicleType} • Detected ${det.timestamp}`}
                >
                  {det.plateNumber}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Layout: 2 Columns (Services Grid + Checkout Cart Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Vehicle Plate Input + Category Pills + Services Catalog (7 or 8 Cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5">
          {/* Vehicle Input & Customer Phone Bar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Vehicle Registration Plate *
              </label>
              <div className="relative">
                <Car className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={posPlateInput}
                  onChange={(e) => setPosPlateInput(e.target.value.toUpperCase())}
                  placeholder="e.g. KDA 482B or KBZ 119C"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-300 focus:border-blue-600 rounded-2xl text-base font-mono font-extrabold text-slate-900 tracking-wider placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Customer Phone (M-Pesa / Loyalty)
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={posCustomerPhone}
                  onChange={(e) => setPosCustomerPhone(e.target.value)}
                  placeholder="e.g. 0712 345 678"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-300 focus:border-blue-600 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Service Cards Grid (Large, Touch-Friendly) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredServices.map((service) => {
              const inCart = cart.find((i) => i.service.id === service.id);
              return (
                <div
                  key={service.id}
                  onClick={() => addToCart(service)}
                  role="button"
                  tabIndex={0}
                  className={`p-4 rounded-3xl border text-left transition-all duration-200 cursor-pointer select-none group relative flex flex-col justify-between ${
                    inCart
                      ? 'bg-blue-50/70 border-blue-400 shadow-sm'
                      : 'bg-white border-slate-200/90 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  {service.popular && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-0.5">
                      <Sparkles className="w-3 h-3 text-amber-600" /> Popular
                    </span>
                  )}

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {service.category}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors mt-0.5">
                      {service.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Price</span>
                      <span className="text-lg font-extrabold text-slate-900">
                        {settings.currency} {service.price.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" /> {service.durationMinutes}m
                      </span>
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                          inCart
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white'
                        }`}
                      >
                        {inCart ? inCart.quantity : <Plus className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Checkout Cart Summary Panel (4 or 5 Cols) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-lg space-y-5 sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-extrabold text-slate-900">Current Order</h3>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="space-y-3 min-h-[160px] max-h-[280px] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center text-slate-400">
                <ShoppingCart className="w-10 h-10 mb-2 stroke-[1.5] text-slate-300" />
                <p className="text-xs font-medium">Cart is currently empty</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click any service on the left to add
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.service.id}
                  className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/70 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {item.service.name}
                    </h4>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {settings.currency} {item.service.price.toLocaleString()} each
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5">
                    <button
                      onClick={() => updateCartQuantity(item.service.id, -1)}
                      className="w-6 h-6 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.service.id, 1)}
                      className="w-6 h-6 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-xs font-extrabold text-slate-900 w-16 text-right">
                    {settings.currency} {(item.service.price * item.quantity).toLocaleString()}
                  </div>

                  <button
                    onClick={() => removeFromCart(item.service.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Discounts */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-blue-600" /> Apply Discount
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                {posDiscount > 0 ? `-${settings.currency} ${posDiscount}` : 'None'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[0, 50, 100, 200].map((d) => (
                <button
                  key={d}
                  onClick={() => setPosDiscount(d)}
                  className={`py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    posDiscount === d
                      ? 'bg-blue-600 text-white border-blue-600 font-bold'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {d === 0 ? '0' : `-${d}`}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Payment Method *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'M-Pesa', label: 'M-Pesa', icon: Smartphone, color: 'text-emerald-600' },
                  { id: 'Cash', label: 'Cash', icon: Banknote, color: 'text-blue-600' },
                  { id: 'Card', label: 'Card', icon: CreditCard, color: 'text-indigo-600' }
                ] as const
              ).map((method) => {
                const Icon = method.icon;
                const isSelected = posPaymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setPosPaymentMethod(method.id)}
                    className={`py-2.5 px-2 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-600 text-blue-900 font-bold ring-2 ring-blue-600/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${method.color}`} />
                    <span className="text-xs">{method.label}</span>
                  </button>
                );
              })}
            </div>

            {/* M-Pesa Till prompt hint */}
            {posPaymentMethod === 'M-Pesa' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-[11px] text-emerald-900 flex items-center justify-between">
                <span>M-Pesa Buy Goods Till:</span>
                <strong className="font-mono font-bold text-xs">{settings.mpesaTillNumber}</strong>
              </div>
            )}

            {/* Cash Tendered & Change calculator */}
            {posPaymentMethod === 'Cash' && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold">Cash Tendered:</span>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder={total.toString()}
                    className="w-28 text-right font-mono font-bold text-xs px-2 py-1 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                {tenderedNum > 0 && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                    <span className="text-slate-600 font-semibold">Change Due:</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      {settings.currency} {changeDue.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pricing Totals */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">
                {settings.currency} {subtotal.toLocaleString()}
              </span>
            </div>

            {posDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount applied:</span>
                <span className="font-mono">- {settings.currency} {posDiscount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-lg font-extrabold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Payable:</span>
              <span className="text-blue-600 font-mono">
                {settings.currency} {total.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Big Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full py-4 rounded-2xl text-sm font-extrabold text-white flex items-center justify-center gap-2 shadow-lg transition-all ${
              cart.length === 0
                ? 'bg-slate-300 cursor-not-allowed shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30 active:scale-[0.99]'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Complete Sale & Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
