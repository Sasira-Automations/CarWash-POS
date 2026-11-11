import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  Clock,
  ToggleLeft,
  ToggleRight,
  X
} from 'lucide-react';
import { useWashFlow } from '../../context/WashFlowContext';
import { ServiceItem } from '../../types';

export const ServicesView: React.FC = () => {
  const { services, addService, updateService, toggleServiceActive, settings } = useWashFlow();

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'Washing' | 'Interior' | 'Detailing' | 'Specialty'>('Washing');
  const [formPrice, setFormPrice] = useState('500');
  const [formDuration, setFormDuration] = useState('30');
  const [formDescription, setFormDescription] = useState('');

  const categories = ['All', 'Washing', 'Interior', 'Detailing', 'Specialty'];

  const filteredServices = services.filter((s) => {
    if (activeCategory === 'All') return true;
    return s.category === activeCategory;
  });

  const handleOpenAdd = () => {
    setFormName('');
    setFormCategory('Washing');
    setFormPrice('500');
    setFormDuration('30');
    setFormDescription('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (srv: ServiceItem) => {
    setEditingService(srv);
    setFormName(srv.name);
    setFormCategory(srv.category);
    setFormPrice(srv.price.toString());
    setFormDuration(srv.durationMinutes.toString());
    setFormDescription(srv.description);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    addService({
      name: formName.trim(),
      category: formCategory,
      price: parseFloat(formPrice) || 0,
      durationMinutes: parseInt(formDuration) || 20,
      active: true,
      description: formDescription.trim() || 'Professional car wash service package'
    });

    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !formName.trim()) return;

    updateService(editingService.id, {
      name: formName.trim(),
      category: formCategory,
      price: parseFloat(formPrice) || 0,
      durationMinutes: parseInt(formDuration) || 20,
      description: formDescription.trim()
    });

    setEditingService(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Services Catalog & Pricing
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure wash packages, prices, and durations displayed in the Point of Sale terminal.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeCategory === cat
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            {cat} ({cat === 'All' ? services.length : services.filter((s) => s.category === cat).length})
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className={`bg-white rounded-3xl p-5 border transition-all ${
              service.active
                ? 'border-slate-200/90 shadow-sm hover:shadow-md'
                : 'border-slate-200 opacity-60 bg-slate-50/50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {service.category}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {service.name}
                </h3>
              </div>

              {/* Active Toggle Switch */}
              <button
                onClick={() => toggleServiceActive(service.id)}
                className="text-slate-400 hover:text-blue-600 transition-colors"
                title={service.active ? 'Deactivate service' : 'Activate service'}
              >
                {service.active ? (
                  <ToggleRight className="w-6 h-6 text-blue-600" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-slate-300" />
                )}
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
              {service.description}
            </p>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Standard Price</span>
                <span className="text-lg font-extrabold text-slate-900">
                  {settings.currency} {service.price.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> {service.durationMinutes} mins
                </span>

                <button
                  onClick={() => handleOpenEdit(service)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Edit service details"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Service Modal */}
      {(isAddModalOpen || editingService) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingService ? 'Edit Service & Pricing' : 'Add New Service Package'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingService(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingService ? handleSaveEdit : handleSaveAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Underbody Rustproofing or Ceramic Coat"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-blue-600"
                  >
                    <option value="Washing">Washing</option>
                    <option value="Interior">Interior</option>
                    <option value="Detailing">Detailing</option>
                    <option value="Specialty">Specialty</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Price ({settings.currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="50"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Estimated Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="What is included in this service..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingService(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30"
                >
                  {editingService ? 'Save Changes' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
