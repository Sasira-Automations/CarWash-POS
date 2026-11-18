import React, { useState } from 'react';
import { CalendarDays, Plus, Receipt, Wallet } from 'lucide-react';
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
    <div className="space-y-5 animate-in fade-in duration-200">
      <header className="flex flex-col justify-between gap-4 rounded-xl border border-[#cfe0f4] bg-[#eaf3ff] p-5 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[#1b5fad]">
            <Wallet className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Operations</span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Expenses</h1>
          <p className="mt-1 text-xs text-slate-600">Record day-to-day costs for {settings.branch}.</p>
        </div>
        <div className="min-w-40 rounded-lg border border-white/80 bg-white/80 px-4 py-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Recorded total</div>
          <div className="mt-1 text-xl font-extrabold tabular-nums text-[#17365f]">
            {settings.currency} {totalExpenses.toLocaleString()}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(280px,0.75fr)_minmax(0,1.5fr)]">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-[#dfe7f1] bg-white p-5 shadow-[0_6px_20px_rgba(32,64,100,0.05)]"
        >
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Record an expense</h2>
            <p className="mt-1 text-xs text-slate-500">Add a business cost to the ledger.</p>
          </div>

          <label className="block text-xs font-semibold text-slate-700">
            Description
            <input
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="e.g. Cleaning supplies"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-slate-700">
              Category
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as ExpenseRecord['category'])}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
              >
                {expenseCategories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Amount
              <input
                required
                min="0.01"
                step="0.01"
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold tabular-nums text-slate-900 outline-none focus:border-blue-500"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-slate-700">
              Date
              <span className="relative mt-1.5 block">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                />
              </span>
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Paid by
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value as ExpenseRecord['paymentMethod'])}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
              >
                {paymentMethods.map((method) => <option key={method}>{method}</option>)}
              </select>
            </label>
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1b5fad] px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#174f91] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <Plus className="h-4 w-4" />
            Add expense
          </button>
          <p className="text-[10px] leading-relaxed text-slate-400">Entries are held in this session and will reset when the page is refreshed.</p>
        </form>

        <section className="overflow-hidden rounded-xl border border-[#dfe7f1] bg-white shadow-[0_6px_20px_rgba(32,64,100,0.05)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent expenses</h2>
              <p className="mt-1 text-xs text-slate-500">{expenses.length} {expenses.length === 1 ? 'entry' : 'entries'}</p>
            </div>
            <Receipt className="h-4 w-4 text-slate-400" />
          </div>

          {expenses.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf3ff] text-[#1b5fad]">
                <Wallet className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-800">No expenses recorded</p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">New expenses will appear here with their category, date, and payment method.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-xs">
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
                    <tr key={expense.id}>
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
          )}
        </section>
      </div>
    </div>
  );
};
