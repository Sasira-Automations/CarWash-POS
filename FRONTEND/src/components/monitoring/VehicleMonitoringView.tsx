import React, { useState } from 'react';
import {
  Video,
  Search,
  Camera,
  Info,
  X,
  ZoomIn
} from 'lucide-react';
import { useWashFlow } from '../../context/WashFlowContext';
import { VehicleDetection } from '../../types';

export const VehicleMonitoringView: React.FC = () => {
  const { detections } = useWashFlow();

  const [searchQuery, setSearchQuery] = useState('');
  const [previewCapture, setPreviewCapture] = useState<VehicleDetection | null>(null);

  const filteredDetections = detections.filter((d) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.vehicleType.toLowerCase().includes(q) ||
        d.entryEventId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const classCount = (vehicleClass: string) => detections.filter((detection) => detection.vehicleClass === vehicleClass).length;

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Vehicle activity
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Camera-Based Vehicle Monitoring
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Vehicle class, image, and capture time for recent vehicle activity.
          </p>
        </div>
      </div>

      {/* Capture counts */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
        <div className="col-span-2 sm:col-span-1 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm flex flex-col justify-between">
          <div className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Total Captures</span>
              <Video className="h-4 w-4 text-blue-600" />
            </div>
            <div className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">{detections.length}</div>
            <div className="mt-0.5 sm:mt-1 text-[11px] text-slate-400">Loaded capture records</div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="h-16 sm:h-24 bg-cover bg-center" style={{ backgroundImage: "url('/images/bus.jpg')" }} />
          <div className="p-3 sm:p-4">
            <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Bus</div>
            <div className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-extrabold text-violet-600">{classCount('Bus')}</div>
            <div className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] text-slate-400">Class: bus</div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="h-16 sm:h-24 bg-cover bg-center" style={{ backgroundImage: "url('/images/motorcycle.jpg')" }} />
          <div className="p-3 sm:p-4">
            <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Motorcycle</div>
            <div className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-600">{classCount('Motorcycle')}</div>
            <div className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] text-slate-400">Class: motorcycle</div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="h-16 sm:h-24 bg-cover bg-center" style={{ backgroundImage: "url('/images/jan-kopriva-sh_7sFEFICI-unsplash.jpg')" }} />
          <div className="p-3 sm:p-4">
            <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Car</div>
            <div className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-extrabold text-blue-600">{classCount('Car')}</div>
            <div className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] text-slate-400">Class: car</div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm col-span-2 sm:col-span-1">
          <div className="h-16 sm:h-24 bg-cover bg-center" style={{ backgroundImage: "url('/images/truck.jpg')" }} />
          <div className="p-3 sm:p-4">
            <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Truck</div>
            <div className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-extrabold text-orange-600">{classCount('Truck')}</div>
            <div className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] text-slate-400">Class: truck</div>
          </div>
        </div>
      </div>

      {/* Crucial Business Logic Note Banner */}
      <div className="bg-gradient-to-r from-blue-50/70 to-slate-50 border border-blue-200/70 rounded-2xl p-3.5 sm:p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-800">
            Important Business Rule: Traffic ≠ Revenue
          </p>
          <p className="leading-relaxed">
            Entrance camera detections represent physical vehicle ingress. Revenue is calculated exclusively when an attendant records a completed POS transaction.
          </p>
        </div>
      </div>

      {/* Detections List & Filter Controls */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900">
            Recent Detections ({filteredDetections.length})
          </h3>
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by class or event ID..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Mobile Cards View (md:hidden) */}
        <div className="md:hidden space-y-3">
          {filteredDetections.map((det) => (
            <div
              key={det.id}
              className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-2.5 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-slate-600 text-xs font-bold bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                  {det.entryEventId}
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  {det.timestamp}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {det.imageUrl ? (
                  <div
                    onClick={() => setPreviewCapture(det)}
                    className="relative w-16 h-14 rounded-xl overflow-hidden border border-slate-200 shrink-0 cursor-pointer bg-slate-900 group"
                  >
                    <img
                      src={det.imageUrl}
                      alt={det.vehicleType}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="w-16 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                    <Camera className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-extrabold text-slate-900 text-sm">
                    {det.vehicleClass}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {det.vehicleType}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                    <Camera className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{det.cameraSource}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredDetections.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              No captures match your search criteria.
            </div>
          )}
        </div>

        {/* Desktop Table (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                <th className="pb-3">Event ID</th>
                <th className="pb-3">Image</th>
                <th className="pb-3">Vehicle Class</th>
                <th className="pb-3">Camera</th>
                <th className="pb-3">Captured At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDetections.map((det) => {
                return (
                  <tr
                    key={det.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3.5 font-mono text-slate-500 font-bold">
                      {det.entryEventId}
                    </td>

                    <td className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        {det.imageUrl && (
                          <img
                            src={det.imageUrl}
                            alt={det.vehicleType}
                            onClick={() => setPreviewCapture(det)}
                            className="w-10 h-8 object-cover rounded-md border border-slate-200 shrink-0 shadow-xs cursor-pointer hover:scale-105 transition-transform"
                          />
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 font-semibold text-slate-800">{det.vehicleClass}</td>

                    <td className="py-3.5 text-slate-600">
                      <span className="flex items-center gap-1 font-medium">
                        <Camera className="w-3 h-3 text-slate-400" />
                        {det.cameraSource}
                      </span>
                    </td>

                    <td className="py-3.5 text-slate-500 font-medium">
                      {det.timestamp}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Capture Modal Preview */}
      {previewCapture && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setPreviewCapture(null)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Vehicle Capture Details
                </h3>
              </div>
              <button
                onClick={() => setPreviewCapture(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                aria-label="Close capture preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto">
              <div className="w-full max-h-[300px] sm:max-h-[360px] rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center p-2">
                <img
                  src={previewCapture.imageUrl}
                  alt={String(previewCapture.vehicleClass)}
                  className="max-h-[280px] sm:max-h-[340px] w-auto object-contain rounded-lg"
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Class</span>
                  <div className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                    {previewCapture.vehicleClass}
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Camera</span>
                  <div className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 truncate">
                    {previewCapture.cameraSource}
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Event ID & Timestamp</span>
                  <div className="text-xs font-mono font-bold text-slate-800 mt-0.5 truncate">
                    {previewCapture.entryEventId} · {previewCapture.timestamp}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
