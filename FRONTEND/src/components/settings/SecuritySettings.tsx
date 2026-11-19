import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  KeyRound,
  Lock,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { resetRateLimit } from '../../lib/rateLimiter';

export const SecuritySettings: React.FC = () => {
  const {
    user,
    isMfaEnrolled,
    enrollMfa,
    verifyMfaEnrollment,
    unenrollMfa,
    refreshMfaStatus,
    rememberMe
  } = useAuth();

  // 2FA Enrollment state
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Status / Loading states
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    refreshMfaStatus();
  }, [refreshMfaStatus]);

  const handleStartEnrollment = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsActionLoading(true);

    try {
      const result = await enrollMfa();
      if (result.error) {
        setErrorMessage(result.error);
      } else {
        setFactorId(result.factorId || null);
        setQrCodeSvg(result.qrCode || null);
        setTotpSecret(result.secret || null);
        setTotpUri(result.uri || null);
        setIsEnrolling(true);
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleVerifyEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;

    const cleanCode = verifyCode.trim().replace(/\s+/g, '');
    if (cleanCode.length !== 6) {
      setErrorMessage('Please enter the 6-digit code from your authenticator app.');
      return;
    }

    setErrorMessage(null);
    setIsActionLoading(true);

    try {
      const result = await verifyMfaEnrollment(factorId, cleanCode);
      if (result.error) {
        setErrorMessage(result.error);
      } else {
        setSuccessMessage('Two-Factor Authentication (2FA) is now active and protecting your account!');
        setIsEnrolling(false);
        setVerifyCode('');
        setFactorId(null);
        await refreshMfaStatus();
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!window.confirm('Are you sure you want to disable Two-Factor Authentication? Your account will be less secure.')) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsActionLoading(true);

    try {
      const result = await unenrollMfa();
      if (result.error) {
        setErrorMessage(result.error);
      } else {
        setSuccessMessage('Two-Factor Authentication has been disabled.');
        await refreshMfaStatus();
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (!totpSecret) return;
    navigator.clipboard.writeText(totpSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2500);
  };

  const handleResetMyRateLimits = () => {
    if (user?.email) {
      resetRateLimit(user.email);
      setSuccessMessage('Rate limiter counters have been reset for your email address.');
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Alert Messages */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* 1. Two-Factor Authentication (2FA) Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Two-Factor Authentication (2FA / TOTP)</h3>
              <p className="text-xs text-slate-500">
                Protect your account by requiring an authenticator code in addition to your password.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isMfaEnrolled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                2FA Enabled (AAL2)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                2FA Disabled
              </span>
            )}
          </div>
        </div>

        {/* 2FA Enrollment In Progress */}
        {isEnrolling ? (
          <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                Step-by-Step 2FA Setup
              </h4>
              <button
                type="button"
                onClick={() => setIsEnrolling(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel Setup
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Open your authenticator app (such as <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong>, <strong>Authy</strong>, or <strong>1Password</strong>) and scan the QR code below or enter the manual key.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
              {/* QR Code container */}
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                {qrCodeSvg ? (
                  <div
                    className="w-48 h-48 flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                  />
                ) : (
                  <div className="w-48 h-48 rounded-xl bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                    <KeyRound className="w-8 h-8 text-blue-500 mb-2" />
                    <span className="text-[11px] font-mono break-all text-slate-700 font-bold">
                      {totpSecret || 'JBSWY3DPEHPK3PXP'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">Manual Setup Key</span>
                  </div>
                )}
                <span className="text-[11px] text-slate-500 mt-2 font-medium">
                  Scan with Authenticator App
                </span>
                {totpUri && (
                  <a
                    href={totpUri}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                  >
                    <span>Open in App</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Secret Key & Verification Form */}
              <div className="space-y-4">
                {totpSecret && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Manual Secret Key
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={totpSecret}
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 font-bold select-all"
                      />
                      <button
                        type="button"
                        onClick={handleCopySecret}
                        className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
                      >
                        {copiedSecret ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleVerifyEnrollment} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Enter 6-Digit App Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      placeholder="000000"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isActionLoading || verifyCode.trim().length !== 6}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isActionLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify & Activate 2FA</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800">
                {isMfaEnrolled ? 'Two-Factor Authentication is Active' : 'Two-Factor Authentication is Disabled'}
              </h4>
              <p className="text-xs text-slate-500 max-w-lg">
                {isMfaEnrolled
                  ? 'Your account is secured with TOTP. When signing in, you will be prompted for your 6-digit authenticator code.'
                  : 'Add an extra layer of protection. Users must provide a 6-digit one-time passcode generated by their mobile authenticator app.'}
              </p>
            </div>

            {isMfaEnrolled ? (
              <button
                type="button"
                onClick={handleDisableMfa}
                disabled={isActionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors shrink-0 disabled:opacity-50"
              >
                {isActionLoading ? 'Processing...' : 'Disable 2FA'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartEnrollment}
                disabled={isActionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all shrink-0 hover:scale-[1.02] disabled:opacity-50 flex items-center gap-2"
              >
                {isActionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                <span>Configure 2FA</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Password Rate Limiting & Hashing Security Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Password Hashing Specification */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Password Hashing & Encryption</h3>
              <p className="text-[11px] text-slate-500">Cryptographic protection standards</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Hashing Algorithm</span>
                <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  bcrypt (cost 10)
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Passwords are automatically hashed server-side with individual cryptographic salts before storage in <code className="font-mono text-[10px] text-slate-700 bg-slate-200/70 px-1 py-0.5 rounded">auth.users.encrypted_password</code>.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Transport Security</span>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  TLS 1.3 / HTTPS
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Authentication credentials never cross networks in cleartext and raw passwords are never recorded in audit logs.
              </p>
            </div>
          </div>
        </div>

        {/* Password Rate Limiting Policy */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Brute-Force Rate Limiting</h3>
              <p className="text-[11px] text-slate-500">Threshold and account lockout rules</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Max Failed Attempts</span>
                <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  5 attempts
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Exceeding 5 consecutive failed sign-in attempts locks the account temporarily with live cooldown countdown.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Lockout Duration</span>
                <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  5 minutes (300s)
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Server-side Supabase rate limits also safeguard the authentication endpoints from automated IP flooding.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetMyRateLimits}
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Rate Limiter Status</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Session Expiration & Remember Me Settings Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Session Expiration & Remember Me</h3>
            <p className="text-xs text-slate-500">Manage inactivity timeout and session lifetime</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Current Login Mode</span>
              {rememberMe ? (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Persistent (Remember Me Active)
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Temporary Session Only
                </span>
              )}
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {rememberMe
                ? 'Your session stays active across browser restarts. To enforce immediate expiration upon closing the browser, leave "Remember me" unchecked on the login screen.'
                : 'Your session expires automatically when the browser window is closed or after 30 minutes of user inactivity.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Inactivity Watchdog</span>
              <span className="font-mono text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                30 Minutes
              </span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              When unremembered, WashFlow automatically terminates inactive sessions to prevent unauthorized physical workstation access in busy car wash offices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
