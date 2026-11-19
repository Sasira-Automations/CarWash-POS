import React, { useState, useEffect } from 'react';
import {
  Droplets,
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset';

export const AuthPage: React.FC = () => {
  const {
    signIn,
    signInWithGoogle,
    signUp,
    isConfigured,
    isPasswordRecovery,
    sendPasswordResetEmail,
    updateUserPassword,
    clearPasswordRecovery
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>(() => (isPasswordRecovery ? 'reset' : 'signin'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [location, setLocation] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

    // 1. Forgot password flow
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

    // 2. Reset password flow (after clicking email recovery link)
    if (mode === 'reset') {
      if (!password || password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
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

    // 3. Regular Sign In / Sign Up
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
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

    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        const result = await signIn(email, password);
        if (result.error) {
          setErrorMsg(result.error);
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
    setIsSubmitting(true);
    const result = await signInWithGoogle();
    if (result.error) setErrorMsg(result.error);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#f3f6f7] text-slate-900 flex items-center justify-center p-4 sm:p-6 font-sans antialiased">
      <div className="w-full max-w-5xl rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-900/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
        
        {/* Left Branding Panel (5 Cols) */}
        <div className="lg:col-span-5 relative isolate overflow-hidden bg-[#123b3a] p-8 sm:p-10 text-white flex flex-col justify-between min-h-56 lg:min-h-0">
          {/* Prominent Car Wash Banner Image Layer */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <img
              src="/images/Screenshot%20From%202026-11-18%2016-51-14.png"
              alt="Blue car covered in wash foam"
              className="auth-hero-image w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#102e2d]/50 via-[#102e2d]/20 to-[#102e2d]/10" />
          </div>

          {/* Brand and concise product context */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 text-sm font-bold text-white">
              <Droplets className="h-3.5 w-3.5 text-cyan-300" />
              WashFlow
            </div>
            
            <h1 className="mt-8 max-w-sm text-3xl font-bold leading-tight text-white">
              Your wash operations, in one place.
            </h1>

            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/85">
              Track vehicle activity, payments, and daily performance.
            </p>
          </div>

          <div className="relative z-10 hidden items-center gap-2 text-xs text-white/70 lg:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            Workspace access
          </div>
        </div>

        {/* Right Form Panel (7 Cols) */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-14 flex flex-col justify-between bg-white">
          <div>
            {/* Authentication setup notice */}

            {/* Header Titles */}
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {mode === 'signin' && 'Welcome back'}
                {mode === 'signup' && 'Create your account'}
                {mode === 'forgot' && 'Reset your password'}
                {mode === 'reset' && 'Create new password'}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {mode === 'signin' && 'Sign in to continue to your dashboard.'}
                {mode === 'signup' && 'Create an account to set up your workspace.'}
                {mode === 'forgot' && "Enter your registered email and we'll send you a recovery link."}
                {mode === 'reset' && 'Choose a secure new password for your account.'}
              </p>
            </div>

            {/* Segmented Mode Switcher or Back Button */}
            {mode === 'forgot' || mode === 'reset' ? (
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
                      ? 'bg-white text-slate-900 shadow-sm'
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
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-medium">{errorMsg}</span>
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
              {mode === 'signup' && (
                <>
                  {/* Full Name */}
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
                        placeholder="e.g. John Kieti"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Car Wash Business Name */}
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

                  {/* Branch Name */}
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

                  {/* Physical Location */}
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
                        placeholder="e.g. 123 Wash St, Clean City"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email (Shown for signin, signup, forgot) */}
              {mode !== 'reset' && (
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

              {/* Password (Shown for signin, signup, reset) */}
              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {mode === 'reset' ? 'New Password' : 'Password'}
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => handleTabSwitch('forgot')}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                    {mode !== 'signin' && (
                      <span className="text-[11px] text-slate-400">
                        Minimum 6 characters
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

              {/* Confirm Password (Sign Up & Reset Password) */}
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
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
            </form>

            {mode === 'signin' && (
              <div className="mt-5">
                <div className="relative mb-4 flex items-center justify-center">
                  <span className="absolute inset-x-0 h-px bg-slate-200" />
                  <span className="relative bg-white px-3 text-[11px] text-slate-400">or continue with</span>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting || !isConfigured}
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
            {mode === 'forgot' && (
              <p>
                Remember your password?{' '}
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
    </div>
  );
};
