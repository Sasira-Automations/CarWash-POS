import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured as isConfigured } from '../lib/supabaseClient';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../lib/rateLimiter';
import { logAuditEvent } from '../services/auditLogService';

export interface OwnerUser {
  id: string;
  email: string;
  fullName?: string;
  businessName?: string;
  branchName?: string;
  location?: string;
  avatarUrl?: string;
}

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  businessName?: string;
  branchName?: string;
  location?: string;
}

export interface AuthResponse {
  error: string | null;
  requiresEmailConfirmation?: boolean;
  requires2FA?: boolean;
  factorId?: string;
  isLocked?: boolean;
  remainingAttempts?: number;
  lockTimeRemainingSeconds?: number;
}

export interface MfaEnrollResult {
  error: string | null;
  factorId?: string;
  qrCode?: string;
  secret?: string;
  uri?: string;
}

interface AuthContextType {
  user: OwnerUser | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  isPasswordRecovery: boolean;
  isMfaPending: boolean;
  mfaFactorId: string | null;
  isMfaEnrolled: boolean;
  rememberMe: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<AuthResponse>;
  signInWithGoogle: () => Promise<AuthResponse>;
  signUp: (params: SignUpParams) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  uploadAvatar: (file: File) => Promise<{ error: string | null; url?: string }>;
  removeAvatar: () => Promise<{ error: string | null }>;
  updateProfile: (updates: { fullName?: string; businessName?: string; branchName?: string; location?: string }) => Promise<{ error: string | null }>;
  sendPasswordResetEmail: (email: string) => Promise<{ error: string | null }>;
  updateUserPassword: (password: string) => Promise<{ error: string | null }>;
  clearPasswordRecovery: () => void;
  // MFA / 2FA
  enrollMfa: () => Promise<MfaEnrollResult>;
  verifyMfaEnrollment: (factorId: string, code: string) => Promise<{ error: string | null }>;
  unenrollMfa: (factorId?: string) => Promise<{ error: string | null }>;
  verifyMfaLogin: (code: string) => Promise<AuthResponse>;
  cancelMfaLogin: () => void;
  refreshMfaStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity timeout when Remember Me is false

const formatOwnerUser = (user: User | null): OwnerUser | null => {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email || '',
    fullName: user.user_metadata?.full_name || user.user_metadata?.name || '',
    businessName: user.user_metadata?.business_name || 'Your Car Wash',
    branchName: user.user_metadata?.branch_name || 'Main Branch',
    location: user.user_metadata?.location || '',
    avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || ''
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<OwnerUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        window.location.hash.includes('type=recovery') ||
        window.location.search.includes('type=recovery')
      );
    }
    return false;
  });

  // 2FA state
  const [isMfaPending, setIsMfaPending] = useState<boolean>(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [isMfaEnrolled, setIsMfaEnrolled] = useState<boolean>(false);

  // Remember Me state
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('washflow_remember_me');
      return stored !== 'false';
    }
    return true;
  });

  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check enrolled MFA factors
  const refreshMfaStatus = useCallback(async () => {
    if (!isConfigured) {
      if (typeof window !== 'undefined') {
        const mockMfa = localStorage.getItem('washflow_mock_mfa_enrolled');
        setIsMfaEnrolled(mockMfa === 'true');
      }
      return;
    }

    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (!error && data) {
        const verifiedFactors = data.totp?.filter((f) => f.status === 'verified') || [];
        setIsMfaEnrolled(verifiedFactors.length > 0);
      }
    } catch (err) {
      console.warn('Failed to list MFA factors:', err);
    }
  }, []);

  // 1. Initial active session check with Session Expiration & 2FA AAL enforcement
  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      refreshMfaStatus();
      return;
    }

    // Check if session shouldn't be remembered and tab was closed
    const isRemembered = localStorage.getItem('washflow_remember_me') !== 'false';
    if (!isRemembered) {
      const hasActiveTab = sessionStorage.getItem('washflow_session_active');
      if (!hasActiveTab) {
        // User closed browser and came back without "Remember Me" -> enforce session expiration
        supabase.auth.signOut().catch(() => {});
        setSession(null);
        setUser(null);
        setIsLoading(false);
        logAuditEvent({
          action: 'AUTH_SESSION_EXPIRED',
          category: 'auth',
          details: { reason: 'Browser closed without Remember Me checked' },
        });
        return;
      }
    }

    const checkAalAndSyncSession = async (currentSession: Session | null) => {
      if (!currentSession) {
        setSession(null);
        setUser(null);
        setIsMfaPending(false);
        setMfaFactorId(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalData && aalData.currentLevel === 'aal1' && aalData.nextLevel === 'aal2') {
          // 2FA TOTP code is required before proceeding to the dashboard
          const factors = await supabase.auth.mfa.listFactors();
          const verifiedFactor = factors.data?.totp?.find((f) => f.status === 'verified');
          if (verifiedFactor) {
            setSession(currentSession);
            setIsMfaPending(true);
            setMfaFactorId(verifiedFactor.id);
            setIsMfaEnrolled(true);
            setUser(null); // Keep user null so dashboard route guard cannot be bypassed
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed checking AAL assurance level:', err);
      }

      // Fully authenticated: aal2 verified or no MFA factors enrolled
      setIsMfaPending(false);
      setMfaFactorId(null);
      setSession(currentSession);
      setUser(formatOwnerUser(currentSession.user));
      refreshMfaStatus();
      setIsLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (!error && initialSession) {
        if (!isRemembered) {
          sessionStorage.setItem('washflow_session_active', 'true');
        }
        checkAalAndSyncSession(initialSession);
      } else {
        setIsLoading(false);
      }
    }).catch((err) => {
      console.error('Error fetching auth session:', err);
      setIsLoading(false);
    });

    // 2. Realtime auth state listener
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }
      await checkAalAndSyncSession(currentSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshMfaStatus]);

  // Inactivity watchdog for unremembered sessions
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    const isRemembered = localStorage.getItem('washflow_remember_me') !== 'false';
    if (!isRemembered && user) {
      inactivityTimerRef.current = setTimeout(async () => {
        logAuditEvent({
          action: 'AUTH_SESSION_EXPIRED',
          category: 'auth',
          details: { reason: '30 minutes inactivity timeout reached' },
          userId: user.id,
          userEmail: user.email,
        });
        await signOut();
        alert('Your WashFlow session has expired due to 30 minutes of inactivity. Please sign in again.');
      }, INACTIVITY_TIMEOUT_MS);
    }
  }, [user]);

  useEffect(() => {
    const isRemembered = localStorage.getItem('washflow_remember_me') !== 'false';
    if (!isRemembered && user) {
      const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
      const handleActivity = () => resetInactivityTimer();

      events.forEach((evt) => window.addEventListener(evt, handleActivity));
      resetInactivityTimer();

      return () => {
        events.forEach((evt) => window.removeEventListener(evt, handleActivity));
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
        }
      };
    }
  }, [user, resetInactivityTimer]);

  // Sign In with Rate Limiting, 2FA Check, and Remember Me
  const signIn = async (email: string, password: string, shouldRemember = true): Promise<AuthResponse> => {
    const trimmedEmail = email.trim();

    // 1. Password Rate Limiting check
    const rlStatus = checkRateLimit(trimmedEmail);
    if (rlStatus.isLocked) {
      await logAuditEvent({
        action: 'AUTH_RATE_LIMIT_BLOCKED',
        category: 'security',
        details: {
          email: trimmedEmail,
          lockTimeRemainingSeconds: rlStatus.lockTimeRemainingSeconds,
          totalFailures: rlStatus.totalFailures
        },
        userEmail: trimmedEmail
      });
      return {
        error: `Account temporarily locked due to too many failed attempts. Please wait ${rlStatus.lockTimeRemainingSeconds} seconds before retrying.`,
        isLocked: true,
        remainingAttempts: 0,
        lockTimeRemainingSeconds: rlStatus.lockTimeRemainingSeconds
      };
    }

    if (!isConfigured) {
      // Mock / Offline mode fallback
      setRememberMe(shouldRemember);
      localStorage.setItem('washflow_remember_me', String(shouldRemember));
      if (!shouldRemember) {
        sessionStorage.setItem('washflow_session_active', 'true');
      }

      const mockMfa = localStorage.getItem('washflow_mock_mfa_enrolled') === 'true';
      if (mockMfa) {
        setIsMfaPending(true);
        setMfaFactorId('mock-factor-id');
        return { error: null, requires2FA: true, factorId: 'mock-factor-id' };
      }

      resetRateLimit(trimmedEmail);
      setUser({
        id: 'mock-user-1',
        email: trimmedEmail,
        fullName: 'Demo Operator',
        businessName: 'Sparkle Wash',
        branchName: 'Main Branch'
      });
      await logAuditEvent({
        action: 'AUTH_SIGN_IN',
        category: 'auth',
        details: { mode: 'offline/mock', rememberMe: shouldRemember },
        userEmail: trimmedEmail
      });
      return { error: null };
    }

    try {
      // Supabase Auth securely sends password over TLS and hashes/verifies using server-side bcrypt
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password
      });

      if (error) {
        // Record failed attempt for rate limiting
        const updatedRl = recordFailedAttempt(trimmedEmail);
        await logAuditEvent({
          action: updatedRl.isLocked ? 'AUTH_RATE_LIMIT_TRIGGERED' : 'AUTH_LOGIN_FAILED',
          category: 'security',
          details: {
            email: trimmedEmail,
            error: error.message,
            remainingAttempts: updatedRl.remainingAttempts,
            isLocked: updatedRl.isLocked
          },
          userEmail: trimmedEmail
        });

        if (updatedRl.isLocked) {
          return {
            error: `Maximum login attempts exceeded. Account is locked for ${updatedRl.lockTimeRemainingSeconds} seconds.`,
            isLocked: true,
            remainingAttempts: 0,
            lockTimeRemainingSeconds: updatedRl.lockTimeRemainingSeconds
          };
        }

        return {
          error: `${error.message}. (${updatedRl.remainingAttempts} attempt${updatedRl.remainingAttempts === 1 ? '' : 's'} remaining)`,
          remainingAttempts: updatedRl.remainingAttempts
        };
      }

      // Successful password authentication: reset rate limiter
      resetRateLimit(trimmedEmail);

      // Handle session persistence configuration
      setRememberMe(shouldRemember);
      localStorage.setItem('washflow_remember_me', String(shouldRemember));
      if (!shouldRemember) {
        sessionStorage.setItem('washflow_session_active', 'true');
      } else {
        sessionStorage.removeItem('washflow_session_active');
      }

      // Check MFA Assurance Level (2FA requirement)
      const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!aalError && aalData && aalData.currentLevel === 'aal1' && aalData.nextLevel === 'aal2') {
        // User has enrolled 2FA -> require TOTP code
        const factors = await supabase.auth.mfa.listFactors();
        const verifiedFactor = factors.data?.totp?.find((f) => f.status === 'verified');
        if (verifiedFactor) {
          setIsMfaPending(true);
          setMfaFactorId(verifiedFactor.id);
          setUser(null);
          return {
            error: null,
            requires2FA: true,
            factorId: verifiedFactor.id
          };
        }
      }

      if (data.session) {
        setSession(data.session);
        setUser(formatOwnerUser(data.session.user));
      }

      await logAuditEvent({
        action: 'AUTH_SIGN_IN',
        category: 'auth',
        details: { method: 'password', rememberMe: shouldRemember },
        userId: data.user?.id,
        userEmail: trimmedEmail
      });

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred during sign in.' };
    }
  };

  // Verify 2FA TOTP code during Sign In
  const verifyMfaLogin = async (code: string): Promise<AuthResponse> => {
    const trimmedCode = code.trim().replace(/\s+/g, '');

    if (!isConfigured) {
      // Mock 2FA verification: accept 6 digits
      if (trimmedCode.length === 6) {
        setIsMfaPending(false);
        setUser({
          id: 'mock-user-1',
          email: 'demo@sparklewash.com',
          fullName: 'Demo Operator',
          businessName: 'Sparkle Wash'
        });
        await logAuditEvent({
          action: 'AUTH_2FA_VERIFIED',
          category: 'security',
          details: { mode: 'mock' },
          userEmail: 'demo@sparklewash.com'
        });
        return { error: null };
      }
      return { error: 'Invalid 6-digit verification code.' };
    }

    if (!mfaFactorId) {
      return { error: 'No active 2FA factor challenge found.' };
    }

    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: mfaFactorId,
        code: trimmedCode
      });

      if (error) {
        await logAuditEvent({
          action: 'AUTH_2FA_FAILED',
          category: 'security',
          details: { error: error.message },
          userEmail: user?.email
        });
        return { error: error.message };
      }

      setIsMfaPending(false);
      setMfaFactorId(null);

      // Session is now elevated to aal2
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        setSession(sessionData.session);
        setUser(formatOwnerUser(sessionData.session.user));
      }

      await logAuditEvent({
        action: 'AUTH_2FA_VERIFIED',
        category: 'security',
        details: { assuranceLevel: 'aal2' },
        userId: sessionData.session?.user.id,
        userEmail: sessionData.session?.user.email
      });

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to verify 2FA code.' };
    }
  };

  const cancelMfaLogin = async () => {
    setIsMfaPending(false);
    setMfaFactorId(null);
    setUser(null);
    setSession(null);
    await signOut();
  };

  // Enroll in 2FA (Generates QR code & Secret)
  const enrollMfa = async (): Promise<MfaEnrollResult> => {
    if (!isConfigured) {
      // Mock enrollment for local demo
      const mockSecret = 'JBSWY3DPEHPK3PXP';
      const mockUri = `otpauth://totp/WashFlow:${user?.email || 'demo@washflow.com'}?secret=${mockSecret}&issuer=WashFlow`;
      return {
        error: null,
        factorId: 'mock-factor-1',
        secret: mockSecret,
        uri: mockUri,
        qrCode: ''
      };
    }

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'WashFlow'
      });

      if (error) {
        return { error: error.message };
      }

      return {
        error: null,
        factorId: data.id,
        qrCode: data.totp?.qr_code,
        secret: data.totp?.secret,
        uri: data.totp?.uri
      };
    } catch (err: any) {
      return { error: err.message || 'Failed to initialize 2FA enrollment.' };
    }
  };

  // Verify and activate newly enrolled 2FA factor
  const verifyMfaEnrollment = async (factorId: string, code: string): Promise<{ error: string | null }> => {
    const trimmedCode = code.trim().replace(/\s+/g, '');

    if (!isConfigured) {
      if (trimmedCode.length === 6) {
        setIsMfaEnrolled(true);
        localStorage.setItem('washflow_mock_mfa_enrolled', 'true');
        await logAuditEvent({
          action: 'AUTH_2FA_ENABLED',
          category: 'security',
          details: { mode: 'mock' },
          userId: user?.id,
          userEmail: user?.email
        });
        return { error: null };
      }
      return { error: 'Please enter a valid 6-digit verification code.' };
    }

    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: trimmedCode
      });

      if (error) {
        return { error: error.message };
      }

      setIsMfaEnrolled(true);
      await logAuditEvent({
        action: 'AUTH_2FA_ENABLED',
        category: 'security',
        details: { factorId, factorType: 'totp' },
        userId: user?.id,
        userEmail: user?.email
      });

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to verify 2FA code.' };
    }
  };

  // Unenroll / disable 2FA
  const unenrollMfa = async (factorId?: string): Promise<{ error: string | null }> => {
    if (!isConfigured) {
      setIsMfaEnrolled(false);
      localStorage.removeItem('washflow_mock_mfa_enrolled');
      await logAuditEvent({
        action: 'AUTH_2FA_DISABLED',
        category: 'security',
        details: { mode: 'mock' },
        userId: user?.id,
        userEmail: user?.email
      });
      return { error: null };
    }

    try {
      let targetFactorId = factorId;
      if (!targetFactorId) {
        const factors = await supabase.auth.mfa.listFactors();
        const active = factors.data?.totp?.find((f) => f.status === 'verified');
        targetFactorId = active?.id;
      }

      if (!targetFactorId) {
        return { error: 'No active 2FA factor found to disable.' };
      }

      const { error } = await supabase.auth.mfa.unenroll({
        factorId: targetFactorId
      });

      if (error) {
        return { error: error.message };
      }

      setIsMfaEnrolled(false);
      await logAuditEvent({
        action: 'AUTH_2FA_DISABLED',
        category: 'security',
        details: { factorId: targetFactorId },
        userId: user?.id,
        userEmail: user?.email
      });

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to disable 2FA.' };
    }
  };

  const signInWithGoogle = async (): Promise<AuthResponse> => {
    if (!isConfigured) {
      return { error: 'Authentication is unavailable. Please contact the administrator.' };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      return { error: error?.message || null };
    } catch (err: any) {
      return { error: err.message || 'Unable to continue with Google.' };
    }
  };

  const signUp = async ({
    email,
    password,
    fullName,
    businessName,
    branchName,
    location
  }: SignUpParams): Promise<AuthResponse> => {
    if (!isConfigured) {
      return { error: 'Authentication is unavailable. Please contact the administrator.' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            business_name: businessName?.trim() || 'Sparkle Wash',
            branch_name: branchName?.trim() || '',
            location: location?.trim() || ''
          }
        }
      });

      if (error) {
        return { error: error.message };
      }

      const requiresEmailConfirmation = !data.session;
      if (data.session) {
        setSession(data.session);
        setUser(formatOwnerUser(data.session.user));
      }

      await logAuditEvent({
        action: 'AUTH_SIGN_UP',
        category: 'auth',
        details: { fullName, businessName, branchName },
        userId: data.user?.id,
        userEmail: email.trim()
      });

      return { error: null, requiresEmailConfirmation };
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred during sign up.' };
    }
  };

  const signOut = async () => {
    try {
      await logAuditEvent({
        action: 'AUTH_SIGN_OUT',
        category: 'auth',
        details: { email: user?.email },
        userId: user?.id,
        userEmail: user?.email
      });

      sessionStorage.removeItem('washflow_session_active');

      if (isConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setSession(null);
      setUser(null);
      setIsMfaPending(false);
      setMfaFactorId(null);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    }
  };

  const compressImage = async (file: File, maxDim = 400, quality = 0.85): Promise<{ blob: Blob; dataUrl: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Canvas context not available'));
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve({ blob, dataUrl });
              } else {
                reject(new Error('Failed to create image blob'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const uploadAvatar = async (file: File): Promise<{ error: string | null; url?: string }> => {
    if (!user) {
      return { error: 'No user signed in.' };
    }

    try {
      const { blob, dataUrl } = await compressImage(file, 400, 0.85);
      let finalUrl = dataUrl;

      if (isConfigured) {
        try {
          const fileExt = 'jpg';
          const filePath = `${user.id}/${Date.now()}.${fileExt}`;
          const { error: storageError } = await supabase.storage
            .from('avatars')
            .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

          if (!storageError) {
            const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(filePath);
            if (publicData?.publicUrl) {
              finalUrl = publicData.publicUrl;
            }
          } else {
            console.warn('Storage upload note (falling back to data URL):', storageError.message);
          }
        } catch (stErr) {
          console.warn('Storage upload failed, using optimized data URL:', stErr);
        }

        const { data: updatedData, error: updateError } = await supabase.auth.updateUser({
          data: { avatar_url: finalUrl }
        });

        if (updateError) {
          return { error: updateError.message };
        }

        if (updatedData?.user) {
          setUser(formatOwnerUser(updatedData.user));
        } else {
          setUser((prev) => (prev ? { ...prev, avatarUrl: finalUrl } : null));
        }
      } else {
        setUser((prev) => (prev ? { ...prev, avatarUrl: finalUrl } : null));
      }

      await logAuditEvent({
        action: 'PROFILE_AVATAR_UPDATED',
        category: 'settings',
        details: { urlLength: finalUrl.length },
        userId: user.id,
        userEmail: user.email
      });

      return { error: null, url: finalUrl };
    } catch (err: any) {
      return { error: err.message || 'Failed to process image.' };
    }
  };

  const removeAvatar = async (): Promise<{ error: string | null }> => {
    try {
      if (isConfigured) {
        const { data: updatedData, error } = await supabase.auth.updateUser({
          data: { avatar_url: '' }
        });
        if (error) return { error: error.message };
        if (updatedData?.user) {
          setUser(formatOwnerUser(updatedData.user));
        } else {
          setUser((prev) => (prev ? { ...prev, avatarUrl: '' } : null));
        }
      } else {
        setUser((prev) => (prev ? { ...prev, avatarUrl: '' } : null));
      }

      await logAuditEvent({
        action: 'PROFILE_AVATAR_REMOVED',
        category: 'settings',
        userId: user?.id,
        userEmail: user?.email
      });

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to remove photo.' };
    }
  };

  const updateProfile = async (updates: {
    fullName?: string;
    businessName?: string;
    branchName?: string;
    location?: string;
  }): Promise<{ error: string | null }> => {
    try {
      if (isConfigured) {
        const { data: updatedData, error } = await supabase.auth.updateUser({
          data: {
            full_name: updates.fullName,
            business_name: updates.businessName,
            branch_name: updates.branchName,
            location: updates.location
          }
        });
        if (error) return { error: error.message };
        if (updatedData?.user) {
          setUser(formatOwnerUser(updatedData.user));
        }
      } else {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                fullName: updates.fullName ?? prev.fullName,
                businessName: updates.businessName ?? prev.businessName,
                branchName: updates.branchName ?? prev.branchName,
                location: updates.location ?? prev.location
              }
            : null
        );
      }

      await logAuditEvent({
        action: 'PROFILE_DETAILS_UPDATED',
        category: 'settings',
        details: updates,
        userId: user?.id,
        userEmail: user?.email
      });

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to update profile.' };
    }
  };

  const sendPasswordResetEmail = async (emailToReset: string): Promise<{ error: string | null }> => {
    if (!isConfigured) {
      return { error: 'Authentication is unavailable. Please contact the administrator.' };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailToReset.trim(), {
        redirectTo: window.location.origin
      });
      if (error) {
        return { error: error.message };
      }

      await logAuditEvent({
        action: 'AUTH_PASSWORD_RESET_REQUESTED',
        category: 'security',
        details: { email: emailToReset.trim() },
        userEmail: emailToReset.trim()
      });

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to send password reset email.' };
    }
  };

  const updateUserPassword = async (newPassword: string): Promise<{ error: string | null }> => {
    if (!isConfigured) {
      return { error: 'Authentication is unavailable. Please contact the administrator.' };
    }
    try {
      // Supabase hashes password with bcrypt (cost 10) on server
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) {
        return { error: error.message };
      }
      setIsPasswordRecovery(false);

      if (typeof window !== 'undefined' && window.history) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      await logAuditEvent({
        action: 'AUTH_PASSWORD_UPDATED',
        category: 'security',
        userId: user?.id,
        userEmail: user?.email
      });

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to update password.' };
    }
  };

  const clearPasswordRecovery = () => {
    setIsPasswordRecovery(false);
    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isConfigured,
        isPasswordRecovery,
        isMfaPending,
        mfaFactorId,
        isMfaEnrolled,
        rememberMe,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        uploadAvatar,
        removeAvatar,
        updateProfile,
        sendPasswordResetEmail,
        updateUserPassword,
        clearPasswordRecovery,
        enrollMfa,
        verifyMfaEnrollment,
        unenrollMfa,
        verifyMfaLogin,
        cancelMfaLogin,
        refreshMfaStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
