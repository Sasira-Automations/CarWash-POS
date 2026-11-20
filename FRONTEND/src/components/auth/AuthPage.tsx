import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Building2,
  MapPin,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Clock,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { checkRateLimit } from '../../lib/rateLimiter';

type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset' | '2fa';

export const AuthPage: React.FC = () => {
  const {
    signIn,
    signInWithGoogle,
    signUp,
    isConfigured,
    isPasswordRecovery,
    isMfaPending,
    verifyMfaLogin,
    cancelMfaLogin,
    sendPasswordResetEmail,
    updateUserPassword,
    clearPasswordRecovery
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>(() => {
    if (isPasswordRecovery) return 'reset';
    if (isMfaPending) return '2fa';
    return 'signin';
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [location, setLocation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [totpCode, setTotpCode] = useState('');
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  // Rate Limiting states
  const [lockCountdown, setLockCountdown] = useState<number>(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isPasswordRecovery) {
      setMode('reset');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isPasswordRecovery]);

  useEffect(() => {
    if (isMfaPending) {
      setMode('2fa');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isMfaPending]);

  // Check rate limit on email change
  useEffect(() => {
    if (mode === 'signin' && email.trim()) {
      const status = checkRateLimit(email.trim());
      if (status.isLocked) {
        setLockCountdown(status.lockTimeRemainingSeconds);
      } else {
        setLockCountdown(0);
        if (status.totalFailures > 0) {
          setRemainingAttempts(status.remainingAttempts);
        } else {
          setRemainingAttempts(null);
        }
      }
    } else {
      setLockCountdown(0);
      setRemainingAttempts(null);
    }
  }, [email, mode]);

  // Countdown timer for rate limiting lockout
  useEffect(() => {
    if (lockCountdown <= 0) return;

    const timer = setInterval(() => {
      setLockCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockCountdown]);

  const resetMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleTabSwitch = (newMode: AuthMode) => {
    setMode(newMode);
    resetMessages();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    // 1. 2FA verification flow
    if (mode === '2fa') {
      const cleanCode = totpCode.trim().replace(/\s+/g, '');
      if (cleanCode.length !== 6) {
        setErrorMsg('Please enter a 6-digit authentication code.');
        return;
      }
      setIsSubmitting(true);
      try {
        const result = await verifyMfaLogin(cleanCode);
        if (result.error) {
          setErrorMsg(result.error);
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // 2. Forgot password flow
    if (mode === 'forgot') {
      if (!email.trim()) {
        setErrorMsg('Please enter your email address.');
        return;
      }
      setIsSubmitting(true);
      try {
        const result = await sendPasswordResetEmail(email.trim());
        if (result.error) {
          setErrorMsg(result.error);
        } else {
          setSuccessMsg(
            `Password reset link sent! Check your inbox at ${email.trim()} (and spam folder) for instructions.`
          );
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // 3. Reset password flow (after clicking email recovery link)
    if (mode === 'reset') {
      if (!password || password.length < 8) {
        setErrorMsg('Password must be at least 8 characters long.');
        return;
      }
      if (!/(?=.*[a-zA-Z])(?=.*[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(password)) {
        setErrorMsg('Password must contain at least one letter and one number or special character.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please verify your new password.');
        return;
      }
      setIsSubmitting(true);
      try {
        const result = await updateUserPassword(password);
        if (result.error) {
          setErrorMsg(result.error);
        } else {
          setSuccessMsg('Your password has been reset successfully! You can now sign in.');
          setPassword('');
          setConfirmPassword('');
          clearPasswordRecovery();
          setMode('signin');
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // 4. Regular Sign In / Sign Up
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (mode === 'signup') {
      if (!agreedToPolicy) {
        setErrorMsg('Please check the box to agree to the collection of your details and privacy policy.');
        return;
      }
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (password.length < 8) {
        setErrorMsg('Password must be at least 8 characters long.');
        return;
      }
      if (!/(?=.*[a-zA-Z])(?=.*[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(password)) {
        setErrorMsg('Password must contain at least one letter and one number or special character.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please verify your password.');
        return;
      }
      if (!businessName.trim()) {
        setErrorMsg('Please enter a business name.');
        return;
      }
      if (!branchName.trim()) {
        setErrorMsg('Please enter a branch name.');
        return;
      }
      if (!location.trim()) {
        setErrorMsg('Please enter the physical location.');
        return;
      }
    }

    // Sign In rate limit check
    if (mode === 'signin' && lockCountdown > 0) {
      setErrorMsg(`Too many failed attempts. Please wait ${lockCountdown} seconds before trying again.`);
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        const result = await signIn(email, password, rememberMe);
        if (result.isLocked && result.lockTimeRemainingSeconds) {
          setLockCountdown(result.lockTimeRemainingSeconds);
          setErrorMsg(result.error);
        } else if (result.requires2FA) {
          setMode('2fa');
          setSuccessMsg('Primary authentication successful. Please enter your 2FA code.');
        } else if (result.error) {
          setErrorMsg(result.error);
          if (result.remainingAttempts !== undefined) {
            setRemainingAttempts(result.remainingAttempts);
          }
        }
      } else {
        const result = await signUp({
          email,
          password,
          fullName,
          businessName: businessName.trim() || undefined,
          branchName: branchName.trim() || undefined,
          location: location.trim() || undefined,
        });

        if (result.error) {
          setErrorMsg(result.error);
        } else if (result.requiresEmailConfirmation) {
          setSuccessMsg(
            'Account created successfully! We sent a confirmation link to your email. Please click it to verify your account and sign in.'
          );
          setMode('signin');
          setPassword('');
          setConfirmPassword('');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    resetMessages();
    if (mode === 'signup' && !agreedToPolicy) {
      setErrorMsg('Please check the agreement box before creating an account with Google.');
      return;
    }
    setIsSubmitting(true);
    const result = await signInWithGoogle();
    if (result.error) setErrorMsg(result.error);
    setIsSubmitting(false);
  };

  const handleCancelMfa = () => {
    cancelMfaLogin();
    setTotpCode('');
    setMode('signin');
    resetMessages();
  };

  return (
    <div className="min-h-screen bg-[#f3f6f7] text-slate-900 flex items-center justify-center p-4 sm:p-6 font-sans antialiased">
      <div className="w-full max-w-5xl rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-900/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
        
        {/* Left Branding Panel (5 Cols) */}
        <div className="lg:col-span-5 relative isolate overflow-hidden bg-[#123b3a] p-8 sm:p-10 text-white flex flex-col justify-between min-h-56 lg:min-h-0">
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <img
              src="/images/Screenshot%20From%202026-11-18%2016-51-14.png"
              alt="Blue car covered in wash foam"
              className="auth-hero-image w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#102e2d]/50 via-[#102e2d]/20 to-[#102e2d]/10" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-3">
              <img
                src="/logo-white.png"
                alt="WashFlow Logo"
                className="h-10 w-auto object-contain"
              />
              <span className="text-xl font-extrabold tracking-tight text-white">WashFlow</span>
            </div>
            
            <h1 className="mt-8 max-w-sm text-3xl font-bold leading-tight text-white">
              Your wash operations, in one place.
            </h1>

            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/85">
              Enterprise security with 2FA, encrypted bcrypt password hashing, and active audit trails.
            </p>
          </div>

          <div className="relative z-10 hidden items-center justify-between text-xs text-white/70 lg:flex pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              <span>Workspace security active</span>
            </div>
            <span className="font-mono text-[11px] text-cyan-200/80">bcrypt (cost 10)</span>
          </div>
        </div>

        {/* Right Form Panel (7 Cols) */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-white">
          <div>
            {/* Header Titles */}
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {mode === 'signin' && 'Welcome back'}
                {mode === 'signup' && 'Create your account'}
                {mode === 'forgot' && 'Reset your password'}
                {mode === 'reset' && 'Create new password'}
                {mode === '2fa' && 'Two-Factor Authentication'}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {mode === 'signin' && 'Sign in to access your WashFlow operations dashboard.'}
                {mode === 'signup' && 'Create an account to set up your workspace.'}
                {mode === 'forgot' && "Enter your registered email and we'll send you a recovery link."}
                {mode === 'reset' && 'Choose a secure new password for your account.'}
                {mode === '2fa' && 'Enter the 6-digit code from your authenticator application.'}
              </p>
            </div>

            {/* Mode Switcher or Back Button */}
            {mode === '2fa' ? (
              <button
                type="button"
                onClick={handleCancelMfa}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 mb-6 group transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:-translate-x-0.5 transition-transform" />
                <span>Cancel & Back to Sign In</span>
              </button>
            ) : mode === 'forgot' || mode === 'reset' ? (
              <button
                type="button"
                onClick={() => {
                  if (mode === 'reset') clearPasswordRecovery();
                  handleTabSwitch('signin');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 mb-6 group transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Sign In</span>
              </button>
            ) : (
              <div className="mb-6 p-1 bg-slate-100 rounded-xl flex items-center gap-1 border border-slate-200/60 max-w-sm">
                <button
                  type="button"
                  onClick={() => handleTabSwitch('signin')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    mode === 'signin'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleTabSwitch('signup')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    mode === 'signup'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Rate Limiting Lockout Warning Banner */}
            {lockCountdown > 0 && (
              <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-3 animate-in fade-in">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-950">Account Temporarily Locked</h4>
                  <p className="mt-0.5 text-amber-800">
                    Maximum failed login attempts reached. Password rate limiter is active to prevent unauthorized access.
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 font-bold bg-amber-100/80 px-2.5 py-1 rounded-lg text-amber-900">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Try again in {lockCountdown}s</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && lockCountdown === 0 && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-medium">{errorMsg}</span>
                  {mode === 'signin' && remainingAttempts !== null && remainingAttempts > 0 && remainingAttempts < 5 && (
                    <span className="block mt-1 text-[11px] font-semibold text-rose-700">
                      Security alert: {remainingAttempts} attempt{remainingAttempts === 1 ? '' : 's'} remaining before account lockout.
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-medium">{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* 2FA Mode View */}
              {mode === '2fa' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3">
                    <KeyRound className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-950">
                      <p className="font-bold">Authenticator Code Required</p>
                      <p className="text-blue-800 mt-0.5">
                        Please open your authenticator app (Google Authenticator, Microsoft Authenticator, or 1Password) and enter the current 6-digit verification code.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      6-Digit Authentication Code
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        autoFocus
                        maxLength={6}
                        required
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="000 000"
                        className="w-full text-center tracking-[0.5em] font-mono text-xl py-3 px-4 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-bold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || totpCode.trim().length !== 6}
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Complete Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      await cancelMfaLogin();
                      setMode('signin');
                      setTotpCode('');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-all"
                  >
                    Cancel & Return to Sign In
                  </button>
                </div>
              )}

              {/* Sign Up Fields */}
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Full name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. John doe"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Business Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Sparkle Wash"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Branch Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={branchName}
                          onChange={(e) => setBranchName(e.target.value)}
                          placeholder="e.g. Main Branch"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Physical Location
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. 123 Wash St"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Email (Signin, Signup, Forgot) */}
              {mode !== 'reset' && mode !== '2fa' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Password (Signin, Signup, Reset) */}
              {mode !== 'forgot' && mode !== '2fa' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {mode === 'reset' ? 'New Password' : 'Password'}
                    </label>
                    {mode !== 'signin' && (
                      <span className="text-[11px] text-slate-400">
                        Min. 8 characters (letters & numbers)
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Remember Me & Forgot Password (Sign In) */}
              {mode === 'signin' && (
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600 font-medium">
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('forgot')}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Confirm Password (Sign Up & Reset) */}
              {(mode === 'signup' || mode === 'reset') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {mode === 'reset' ? 'Confirm New Password' : 'Confirm Password'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Agreement Policy Checkbox (Sign Up) */}
              {mode === 'signup' && (
                <div className="pt-1 pb-1">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={agreedToPolicy}
                      onChange={(e) => setAgreedToPolicy(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer shrink-0"
                    />
                    <span className="text-[11px] text-slate-600 leading-snug">
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => setShowPolicyModal(true)}
                        className="font-bold text-blue-600 hover:text-blue-800 underline underline-offset-2"
                      >
                        Privacy & Data Agreement Policy
                      </button>
                      . By checking this box, I consent to the collection and processing of my personal and car wash business details for account registration and operations.
                    </span>
                  </label>
                </div>
              )}

              {/* Submit Button */}
              {mode !== '2fa' && (
                <button
                  type="submit"
                  disabled={isSubmitting || lockCountdown > 0}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {mode === 'signin' && 'Authenticating...'}
                        {mode === 'signup' && 'Creating Account...'}
                        {mode === 'forgot' && 'Sending Reset Link...'}
                        {mode === 'reset' && 'Updating Password...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        {mode === 'signin' && 'Sign in'}
                        {mode === 'signup' && 'Create account'}
                        {mode === 'forgot' && 'Send Reset Link'}
                        {mode === 'reset' && 'Update Password'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </form>

            {/* Google Sign-in */}
            {mode === 'signin' && (
              <div className="mt-5 space-y-3">
                <p className="text-[11px] text-center text-slate-400">
                  By signing in, you agree to our{' '}
                  <button
                    type="button"
                    onClick={() => setShowPolicyModal(true)}
                    className="text-slate-600 hover:text-blue-600 underline font-medium"
                  >
                    Privacy & Data Agreement Policy
                  </button>
                  .
                </p>
                <div className="relative mb-4 flex items-center justify-center">
                  <span className="absolute inset-x-0 h-px bg-slate-200" />
                  <span className="relative bg-white px-3 text-[11px] text-slate-400">or continue with</span>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting || !isConfigured || lockCountdown > 0}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-4 w-4">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" transform="translate(0 5)" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.05 46.98 31.9 46.98 24.55Z" />
                      <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z" transform="translate(0 5)" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.14 1.44-4.88 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
                    </svg>
                  )}
                  Continue with Google
                </button>
              </div>
            )}
          </div>

          {/* Bottom Switcher Footer */}
          <div className="pt-6 mt-6 border-t border-slate-100 text-center text-xs text-slate-500">
            {mode === 'signin' && (
              <p>
                New to WashFlow?{' '}
                <button
                  type="button"
                  onClick={() => handleTabSwitch('signup')}
                  className="font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Create one now
                </button>
              </p>
            )}
            {mode === 'signup' && (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleTabSwitch('signin')}
                  className="font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Sign in here
                </button>
              </p>
            )}
            {mode === 'reset' && (
              <p>
                Need to sign in instead?{' '}
                <button
                  type="button"
                  onClick={() => {
                    clearPasswordRecovery();
                    handleTabSwitch('signin');
                  }}
                  className="font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Back to sign in
                </button>
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Privacy & Data Collection Policy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Privacy & Data Collection Policy</h3>
                  <p className="text-[11px] text-slate-400">WashFlow User & Data Agreement</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs text-slate-600 overflow-y-auto pr-1">
              <div>
                <h4 className="font-bold text-slate-800 mb-1">1. Information We Collect</h4>
                <p className="leading-relaxed">
                  During registration, WashFlow collects your <strong>Full Name</strong>, <strong>Email Address</strong>, <strong>Car Wash Business Name</strong>, <strong>Branch Name</strong>, and <strong>Physical Location</strong>.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 mb-1">2. Purpose of Collection</h4>
                <p className="leading-relaxed">
                  Your information is collected and processed specifically to set up your owner dashboard workspace, customize customer thermal receipts, manage car wash service bays, and associate automated ESP32-CAM vehicle detection data with your branch.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 mb-1">3. Data Security & Confidentiality</h4>
                <p className="leading-relaxed">
                  All personal and business data is encrypted in transit and at rest using Supabase authentication infrastructure, bcrypt password hashing, and Row Level Security (RLS) policies. Your details are never sold to third parties.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 mb-1">4. Consent & User Control</h4>
                <p className="leading-relaxed">
                  By checking the agreement box on sign-up, you provide informed consent for WashFlow to store and process this data for your account. You retain full control to edit or update your business profile at any time in System Settings.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setAgreedToPolicy(true);
                  setShowPolicyModal(false);
                }}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors"
              >
                I Agree & Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
