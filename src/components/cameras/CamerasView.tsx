import React from 'react';
import {
  Cctv,
  Activity,
  RefreshCw
} from 'lucide-react';
import { useWashFlow } from '../../context/WashFlowContext';

export const CamerasView: React.FC = () => {
  const { cameras, toggleCameraStatus, triggerManualCameraDetection, showToast } = useWashFlow();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cctv className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Camera Hardware & Edge Device Diagnostics
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Network surveillance cameras, IP endpoints, ANPR edge inference nodes, and duplicate suppression timers.
          </p>
        </div>

        <button
          onClick={triggerManualCameraDetection}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02]"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Ping Cameras & Test Detection</span>
        </button>
      </div>

      {/* Camera Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {cameras.map((camera) => {
          const isOnline = camera.status === 'online';
          return (
            <div
              key={camera.id}
              className={`bg-white rounded-3xl p-6 border transition-all ${
                isOnline
                  ? 'border-slate-200/90 shadow-sm hover:shadow-md'
                  : 'border-rose-200 bg-rose-50/20'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {camera.location}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                    {camera.name}
                  </h3>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    isOnline
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>

              {/* Specs */}
              <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">IP Address:</span>
                  <span className="font-mono font-bold text-slate-800">{camera.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stream Spec:</span>
                  <span className="font-medium text-slate-700">{camera.resolution}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Firmware:</span>
                  <span className="font-mono text-slate-600">{camera.firmware}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Ping:</span>
                  <span className="text-slate-600 font-medium">{camera.lastPing}</span>
                </div>
              </div>

              {/* Activity count */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Today's Detections
                  </span>
                  <span className="text-xl font-extrabold text-slate-900">
                    {camera.todayDetections}
                  </span>
                </div>

                <button
                  onClick={() => {
                    toggleCameraStatus(camera.id);
                    showToast(
                      `${camera.name} toggled to ${
                        camera.status === 'online' ? 'Offline' : 'Online'
                      }`
                    );
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    isOnline
                      ? 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {isOnline ? 'Simulate Disconnect' : 'Reconnect Camera'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edge Vision Engine Rules Panel */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Computer Vision Inference & Anti-Duplicate Parameters
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">
              Plate Recognition (ANPR)
            </span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Trained on East African plate layouts (e.g. KDA 482B). Confidence scores below 85% are automatically flagged for manual review.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">
              Duplicate Suppression (15 Mins)
            </span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Prevents double counting when a car lingers or idles at the gate. Any recurring plate detected within 15 minutes is logged as a duplicate pass.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">
              POS Isolation Architecture
            </span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Detection streams are strictly decoupled from accounting. Sales records and ledger balances cannot be manipulated by camera feeds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
