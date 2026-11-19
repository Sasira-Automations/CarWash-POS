import React from 'react';
import { X, Printer, CheckCircle2, Share2, Sparkles } from 'lucide-react';
import { Transaction } from '../../types';
import { useWashFlow } from '../../context/WashFlowContext';

interface ReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose }) => {
  const { settings, showToast } = useWashFlow();

  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
    showToast('Receipt sent to printer');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full max-h-[92vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Control Bar */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Sale Receipt Generated</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thermal Receipt Paper Layout (Scrollable on mobile) */}
        <div className="p-4 sm:p-6 bg-slate-50/50 overflow-y-auto flex-1">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm font-mono text-xs text-slate-700 space-y-4">
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="font-extrabold text-sm text-slate-900 tracking-tight font-sans">
                  {settings.businessName}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">{settings.branch}</p>
              <p className="text-[10px] text-slate-400 font-sans">{settings.location}</p>
              <p className="text-[10px] text-slate-400 font-sans">Tel: {settings.phone}</p>
            </div>

            {/* Receipt Meta */}
            <div className="text-[11px] space-y-1 pb-3 border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Receipt No:</span>
                <span className="font-bold text-slate-900">{transaction.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date/Time:</span>
                <span>{transaction.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Attendant:</span>
                <span>{transaction.attendantName}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-400">Vehicle Plate:</span>
                <span className="font-extrabold text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono border border-amber-300">
                  {transaction.vehiclePlate}
                </span>
              </div>
              {transaction.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer Tel:</span>
                  <span>{transaction.customerPhone}</span>
                </div>
              )}
            </div>

            {/* Itemized Services */}
            <div className="space-y-2 pb-3 border-b border-dashed border-slate-300">
              <div className="flex justify-between text-[10px] text-slate-400 uppercase font-sans font-bold">
                <span>Service</span>
                <span>Amount</span>
              </div>

              {transaction.services.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{item.name}</div>
                    {item.quantity > 1 && (
                      <div className="text-[10px] text-slate-400">
                        {item.quantity} x {settings.currency} {item.price.toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="font-bold text-slate-900">
                    {settings.currency} {(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1.5 pb-3 border-b border-dashed border-slate-300 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>{settings.currency} {transaction.subtotal.toLocaleString()}</span>
              </div>

              {transaction.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount:</span>
                  <span>- {settings.currency} {transaction.discount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL PAID:</span>
                <span>{settings.currency} {transaction.total.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="text-[11px] space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="font-bold text-slate-900">{transaction.paymentMethod}</span>
              </div>

              {transaction.paymentMethod === 'M-Pesa' && (
                <>
                  <div className="flex justify-between">
                    <span>M-Pesa Till:</span>
                    <span>{settings.mpesaTillNumber}</span>
                  </div>
                  {transaction.mpesaRef && (
                    <div className="flex justify-between">
                      <span>M-Pesa Ref:</span>
                      <span className="font-mono font-bold text-blue-600">{transaction.mpesaRef}</span>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-emerald-700 font-bold uppercase">{transaction.status}</span>
              </div>
            </div>

            {/* Receipt Footer Note */}
            <div className="text-center pt-2 text-[10px] text-slate-400 font-sans whitespace-pre-line border-t border-dashed border-slate-200">
              {settings.receiptFooter}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(
                `WashFlow Receipt: ${transaction.receiptNumber} for ${transaction.vehiclePlate}. Amount: ${settings.currency} ${transaction.total}. Thank you!`
              );
              showToast('Receipt summary copied to clipboard');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Share</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
