import React, { useState } from 'react';
import {
  Video,
  Search,
  Camera,
  Info
} from 'lucide-react';
import { useWashFlow } from '../../context/WashFlowContext';

export const VehicleMonitoringView: React.FC = () => {
  const { detections } = useWashFlow();

  const [searchQuery, setSearchQuery] = useState('');
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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              ESP32-CAM database detections
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Camera-Based Vehicle Monitoring
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Vehicle class, image path, and capture time are read from the vehicle_captures table.
          </p>
        </div>

      </div>

      {/* Capture counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Captures</span>
            <Video className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {detections.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Loaded capture records</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Cars</span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2">
            {classCount('Car')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Class: car</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Trucks</span>
          </div>
          <div className="text-3xl font-extrabold text-indigo-600 mt-2">
            {classCount('Truck')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Class: truck</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Buses &amp; motorcycles</span>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 mt-2">
            {classCount('Bus') + classCount('Motorcycle')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Classes: bus, motorcycle</div>
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
          {/* Search bar */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by class or capture ID..."
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
                            className="w-10 h-8 object-cover rounded-md border border-slate-200 shrink-0 shadow-xs"
                          />
                        )}
                        <div>
                        </div>
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
    </div>
  );
};
