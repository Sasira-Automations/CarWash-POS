import React, { useState } from 'react';
import { CalendarDays, Plus, Receipt, Wallet, Banknote, Smartphone, CreditCard } from 'lucide-react';
import { useWashFlow } from '../../context/WashFlowContext';
import { ExpenseRecord } from '../../types';

const expenseCategories: ExpenseRecord['category'][] = [
  'Supplies',
  'Utilities',
  'Maintenance',
  'Payroll',
  'Rent',
  'Other'
];

const paymentMethods: ExpenseRecord['paymentMethod'][] = ['Cash', 'M-Pesa', 'Card'];

const today = () => {
  const date = new Date();
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

export const ExpensesView: React.FC = () => {
  const { expenses, addExpense, settings } = useWashFlow();
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseRecord['category']>('Supplies');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [paymentMethod, setPaymentMethod] = useState<ExpenseRecord['paymentMethod']>('Cash');

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!description.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return;

    addExpense({
      description: description.trim(),
      category,
      amount: parsedAmount,
      date,
      paymentMethod
    });
    setDescription('');
    setAmount('');
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      <header className="flex flex-col justify-between gap-3 sm:gap-4 rounded-2xl border border-[#cfe0f4] bg-[#eaf3ff] p-4 sm:p-5 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[#1b5fad]">
            <Wallet className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Operations</span>
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">Expenses</h1>
          <p className="mt-0.5 sm:mt-1 text-xs text-slate-600">Record day-to-day costs for {settings.branch}.</p>
        </div>
        <div className="rounded-xl border border-white/80 bg-white/80 px-4 py-2.5 sm:py-3 self-start sm:self-auto min-w-[140px]">
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Recorded total</div>
          <div className="mt-0.5 sm:mt-1 text-lg sm:text-xl font-extrabold tabular-nums text-[#17365f]">
            {settings.currency} {totalExpenses.toLocaleString()}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(280px,0.75fr)_minmax(0,1.5fr)]">
        <form
          onSubmit={handleSubmit}
          className="space-y-3.5 sm:space-y-4 rounded-2xl border border-[#dfe7f1] bg-white p-4 sm:p-5 shadow-[0_6px_20px_rgba(32,64,100,0.05)]"
        >
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Record an expense</h2>
            <p className="mt-0.5 text-xs text-slate-500">Add a business cost to the ledger.</p>
          </div>

          <label className="block text-xs font-semibold text-slate-700">
            Description
            <input
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="e.g. Cleaning supplies"
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-slate-700">
              Category
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as ExpenseRecord['category'])}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
              >
                {expenseCategories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Amount ({settings.currency})
              <input
                required
                min="0.01"
                step="0.01"
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold tabular-nums text-slate-900 outline-none focus:border-blue-500"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-slate-700">
              Date
              <span className="relative mt-1.5 block">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                />
              </span>
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Paid by
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value as ExpenseRecord['paymentMethod'])}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
              >
                {paymentMethods.map((method) => <option key={method}>{method}</option>)}
              </select>
            </label>
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b5fad] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#174f91] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <Plus className="h-4 w-4" />
            Add expense
          </button>
        </form>

        <section className="overflow-hidden rounded-2xl border border-[#dfe7f1] bg-white shadow-[0_6px_20px_rgba(32,64,100,0.05)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-5 py-3.5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent expenses</h2>
              <p className="mt-0.5 text-xs text-slate-500">{expenses.length} {expenses.length === 1 ? 'entry' : 'entries'}</p>
            </div>
            <Receipt className="h-4 w-4 text-slate-400" />
          </div>

          {expenses.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center px-6 py-8 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf3ff] text-[#1b5fad]">
                <Wallet className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-800">No expenses recorded</p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">New expenses will appear here with their category, date, and payment method.</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards View (md:hidden) */}
              <div className="md:hidden p-3 space-y-2.5">
                {expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-slate-900 text-xs">
                        {expense.description}
                      </div>
                      <div className="font-extrabold text-sm text-slate-900 tabular-nums shrink-0">
                        {settings.currency} {expense.amount.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium text-[10px]">
                          {expense.category}
                        </span>
                        <span>{expense.date}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 text-[10px]">
                        {expense.paymentMethod === 'Cash' && <Banknote className="w-3 h-3 text-blue-600" />}
                        {expense.paymentMethod === 'M-Pesa' && <Smartphone className="w-3 h-3 text-emerald-600" />}
                        {expense.paymentMethod === 'Card' && <CreditCard className="w-3 h-3 text-violet-600" />}
                        {expense.paymentMethod}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table (hidden md:block) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Expense</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Paid by</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3 font-semibold text-slate-800">{expense.description}</td>
                        <td className="px-4 py-3 text-slate-600">{expense.category}</td>
                        <td className="px-4 py-3 tabular-nums text-slate-600">{expense.date}</td>
                        <td className="px-4 py-3 text-slate-600">{expense.paymentMethod}</td>
                        <td className="px-5 py-3 text-right font-bold tabular-nums text-slate-900">{settings.currency} {expense.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
