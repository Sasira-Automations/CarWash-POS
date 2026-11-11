import React, { useState } from 'react';
import {
  Video,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  Edit2,
  Check,
  X,
  Search,
  ArrowUpRight,
  Sparkles,
  Camera,
  Info
} from 'lucide-react';
import { useWashFlow } from '../../context/WashFlowContext';
import { VehicleDetection } from '../../types';

export const VehicleMonitoringView: React.FC = () => {
  const {
    detections,
    correctPlateNumber,
    triggerManualCameraDetection,
    quickChargePlateInPOS,
    stats
  } = useWashFlow();

  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'needs_review' | 'duplicate_blocked'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPlateText, setEditPlateText] = useState('');

  const filteredDetections = detections.filter((d) => {
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.plateNumber.toLowerCase().includes(q) ||
        d.vehicleType.toLowerCase().includes(q) ||
        d.entryEventId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStartEdit = (det: VehicleDetection) => {
    setEditingId(det.id);
    setEditPlateText(det.plateNumber);
  };

  const handleSaveEdit = (detId: string) => {
    if (editPlateText.trim()) {
      correctPlateNumber(detId, editPlateText);
    }
    setEditingId(null);
  };

  const confirmedCount = detections.filter((d) => d.status === 'confirmed').length;
  const duplicateBlockedCount = detections.filter((d) => d.isDuplicate).length;
  const needsReviewCount = detections.filter((d) => d.status === 'needs_review').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              YOLOv8 Edge ANPR • Automatic Number Plate Recognition
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Camera-Based Vehicle Monitoring
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Live vehicle ingress detection at Entrance Gate 1. Ingress records track traffic volume and provide plate recognition for instant POS linkage without double-counting.
          </p>
        </div>

        <button
          onClick={triggerManualCameraDetection}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] shrink-0"
        >
          <RotateCw className="w-4 h-4" />
          <span>Simulate Vehicle Entry</span>
        </button>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Detections</span>
            <Video className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {stats.vehiclesToday}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Ingress gate passes today</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Confirmed Plates</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2">
            {confirmedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Confidence &gt; 90%</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Duplicates Prevented</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-indigo-600 mt-2">
            {duplicateBlockedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">15-min cooldown window</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Needs Review</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600 mt-2">
            {needsReviewCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Manual plate edit available</div>
        </div>
      </div>

      {/* Crucial Business Logic Note Banner */}
      <div className="bg-gradient-to-r from-blue-50/70 to-slate-50 border border-blue-200/70 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-800">
            Important Business Rule: Traffic ≠ Revenue
          </p>
          <p>
            Entrance camera detections represent physical vehicle ingress. A vehicle can enter without purchasing a wash (e.g. inquiries, deliveries, or drop-offs). Revenue is calculated exclusively when an attendant records a completed POS transaction.
          </p>
        </div>
      </div>

      {/* Detections List & Filter Controls */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status filters */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl text-xs font-semibold">
            {(
              [
                { id: 'all', label: `All (${detections.length})` },
                { id: 'confirmed', label: `Confirmed (${confirmedCount})` },
                { id: 'needs_review', label: `Needs Review (${needsReviewCount})` },
                { id: 'duplicate_blocked', label: `Duplicates (${duplicateBlockedCount})` }
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  filterStatus === f.id
                    ? 'bg-white text-blue-600 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by plate or vehicle..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Detections Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                <th className="pb-3">Event ID</th>
                <th className="pb-3">Detected Plate</th>
                <th className="pb-3">Vehicle Details</th>
                <th className="pb-3">Camera Source</th>
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">ANPR Confidence</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">POS Link</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDetections.map((det) => {
                const isEditing = editingId === det.id;
                const isPaid = Boolean(det.matchedTransactionId);

                return (
                  <tr
                    key={det.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      det.isDuplicate ? 'bg-slate-50/50 opacity-70' : ''
                    }`}
                  >
                    <td className="py-3.5 font-mono text-slate-500 font-bold">
                      {det.entryEventId}
                    </td>

                    {/* Plate with inline manual editing */}
                    <td className="py-3.5">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editPlateText}
                            onChange={(e) => setEditPlateText(e.target.value.toUpperCase())}
                            className="w-24 px-2 py-1 font-mono font-bold text-xs uppercase bg-white border border-blue-500 rounded-lg focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(det.id)}
                            className="p-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-xs px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 shadow-xs">
                            {det.plateNumber}
                          </span>
                          <button
                            onClick={() => handleStartEdit(det)}
                            className="text-slate-400 hover:text-blue-600 transition-colors"
                            title="Manually correct OCR plate reading"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      {det.manualCorrection && (
                        <div className="text-[9px] text-blue-600 font-medium mt-0.5">
                          {det.manualCorrection}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5">
                      <div className="font-semibold text-slate-800">{det.vehicleType}</div>
                      <div className="text-[10px] text-slate-400">{det.vehicleColor}</div>
                    </td>

                    <td className="py-3.5 text-slate-600">
                      <span className="flex items-center gap-1 font-medium">
                        <Camera className="w-3 h-3 text-slate-400" />
                        {det.cameraSource}
                      </span>
                    </td>

                    <td className="py-3.5 text-slate-500 font-medium">
                      {det.timestamp}
                    </td>

                    <td className="py-3.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              det.confidence >= 90
                                ? 'bg-emerald-500'
                                : det.confidence >= 80
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${det.confidence}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-700">
                          {det.confidence}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5">
                      {det.isDuplicate ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                          Duplicate Blocked
                        </span>
                      ) : det.status === 'confirmed' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Confirmed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Needs Review
                        </span>
                      )}
                    </td>

                    <td className="py-3.5">
                      {isPaid ? (
                        <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {det.matchedTransactionId}
                        </span>
                      ) : det.isDuplicate ? (
                        <span className="text-[10px] text-slate-400 italic">N/A</span>
                      ) : (
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                          Unbilled
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 text-right">
                      {!isPaid && !det.isDuplicate && (
                        <button
                          onClick={() => quickChargePlateInPOS(det.plateNumber)}
                          className="px-3 py-1 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors inline-flex items-center gap-1"
                        >
                          <span>Charge in POS</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
