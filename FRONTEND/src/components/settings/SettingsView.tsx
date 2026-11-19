import React, { useState, useRef } from 'react';
import {
  Settings,
  Building,
  Smartphone,
  Save,
  FileText,
  User,
  Camera,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { useWashFlow } from '../../context/WashFlowContext';
import { useAuth } from '../../context/AuthContext';
import { SecuritySettings } from './SecuritySettings';
import { AuditLogsView } from './AuditLogsView';

type SettingsSubTab = 'business' | 'security' | 'audit';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useWashFlow();
  const { user, uploadAvatar, removeAvatar, updateProfile } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>('business');

  const [businessName, setBusinessName] = useState(settings.businessName);
  const [branch, setBranch] = useState(settings.branch);
  const [phone, setPhone] = useState(settings.phone);
  const [email] = useState(settings.email);
  const [location, setLocation] = useState(settings.location);
  const [currency, setCurrency] = useState(settings.currency);
  const [mpesaTillNumber, setMpesaTillNumber] = useState(settings.mpesaTillNumber);
  const [receiptHeader, setReceiptHeader] = useState(settings.receiptHeader);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter);
  const [duplicateCooldownSeconds, setDuplicateCooldownSeconds] = useState(
    settings.duplicateCooldownSeconds.toString()
  );

  // Profile photo states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoSuccess, setPhotoSuccess] = useState<string | null>(null);

  // Profile name state
  const [ownerFullName, setOwnerFullName] = useState(user?.fullName || '');
  const [isSavingName, setIsSavingName] = useState(false);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);
    setPhotoSuccess(null);

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image must be under 5MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setPhotoError('Selected file is not an image.');
      return;
    }

    setIsUploading(true);
    const result = await uploadAvatar(file);
    setIsUploading(false);

    if (result.error) {
      setPhotoError(result.error);
    } else {
      setPhotoSuccess('Profile photo updated successfully!');
      setTimeout(() => setPhotoSuccess(null), 4000);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
    setPhotoError(null);
    setPhotoSuccess(null);
    setIsUploading(true);
    const result = await removeAvatar();
    setIsUploading(false);

    if (result.error) {
      setPhotoError(result.error);
    } else {
      setPhotoSuccess('Profile photo removed.');
      setTimeout(() => setPhotoSuccess(null), 3000);
    }
  };

  const handleUpdateName = async () => {
    if (!ownerFullName.trim()) return;
    setIsSavingName(true);
    const result = await updateProfile({ fullName: ownerFullName.trim() });
    setIsSavingName(false);
    if (!result.error) {
      setPhotoSuccess('Profile name updated!');
      setTimeout(() => setPhotoSuccess(null), 3000);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      businessName,
      branch,
      phone,
      email,
      location,
      currency,
      mpesaTillNumber,
      receiptHeader,
      receiptFooter,
      duplicateCooldownSeconds: parseInt(duplicateCooldownSeconds) || 900
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Sub-Tab Navigation */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Settings & Security Configuration
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure business branding, 2FA security, password policies, session timeouts, and audit logs.
          </p>
        </div>

        {activeSubTab === 'business' && (
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        )}
      </div>

      {/* Segmented Sub-Tab Switcher */}
      <div className="p-1 bg-slate-200/70 rounded-2xl flex items-center gap-1 max-w-xl border border-slate-300/40">
        <button
          type="button"
          onClick={() => setActiveSubTab('business')}
          className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'business'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Business & Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('security')}
          className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'security'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Security & 2FA</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('audit')}
          className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'audit'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit Logs</span>
        </button>
      </div>

      {/* Sub-Tab 2: Security & 2FA */}
      {activeSubTab === 'security' && <SecuritySettings />}

      {/* Sub-Tab 3: Audit Logs */}
      {activeSubTab === 'audit' && <AuditLogsView />}

      {/* Sub-Tab 1: Business Profile & Receipt Settings */}
      {activeSubTab === 'business' && (
        <div className="space-y-6">
          {/* Profile Photo & Owner Account Section */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Owner Profile & Photo</h3>
              </div>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                Owner Account
              </span>
            </div>

            {photoSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{photoSuccess}</span>
              </div>
            )}

            {photoError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-800 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{photoError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar preview */}
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-2xl border-2 border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center text-slate-400 shadow-sm">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName || 'Profile'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-2xl">
                      {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <User className="w-8 h-8 text-blue-400" />}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  title="Change profile photo"
                  className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-transform hover:scale-110 disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {user?.fullName || 'Car Wash Owner'}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {user?.email || 'No email attached'}
                    </p>
                  </div>

                  {/* Editable Name Input */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Owner Name"
                      value={ownerFullName}
                      onChange={(e) => setOwnerFullName(e.target.value)}
                      className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={handleUpdateName}
                      disabled={isSavingName || !ownerFullName.trim() || ownerFullName === user?.fullName}
                      className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 transition-colors"
                    >
                      {isSavingName ? 'Saving...' : 'Update Name'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-3.5 h-3.5 text-slate-600" />
                        <span>Upload Photo</span>
                      </>
                    )}
                  </button>

                  {user?.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={isUploading}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200/80 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Photo</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Supported formats: JPEG, PNG, WebP (up to 5MB). Photo updates across navbar and sidebar automatically.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Business Profile */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Building className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Car Wash Business Details</h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Branch / Location Name
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Physical Location / Address
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Currency & Payment Gateways */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Currency & Payment Gateways</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    M-Pesa Buy Goods Till
                  </label>
                  <input
                    type="text"
                    value={mpesaTillNumber}
                    onChange={(e) => setMpesaTillNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Camera Duplicate Cooldown (Seconds)
                </label>
                <input
                  type="number"
                  step="60"
                  value={duplicateCooldownSeconds}
                  onChange={(e) => setDuplicateCooldownSeconds(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-blue-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  900 seconds = 15 minutes. Vehicles seen within this window won't trigger duplicate traffic counts.
                </p>
              </div>
            </div>

            {/* Receipt Customization (Span 2) */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Thermal Receipt Custom Text</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Receipt Header Notice
                  </label>
                  <textarea
                    rows={3}
                    value={receiptHeader}
                    onChange={(e) => setReceiptHeader(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Receipt Footer Closing
                  </label>
                  <textarea
                    rows={3}
                    value={receiptFooter}
                    onChange={(e) => setReceiptFooter(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
