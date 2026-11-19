import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured as isConfigured } from '../lib/supabaseClient';

export interface OwnerUser {
  id: string;
  email: string;
  fullName?: string;
  businessName?: string;
  branchName?: string;
  location?: string;
  avatarUrl?: string;
}

interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  businessName?: string;
  branchName?: string;
  location?: string;
}

interface AuthResponse {
  error: string | null;
  requiresEmailConfirmation?: boolean;
}

interface AuthContextType {
  user: OwnerUser | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  isPasswordRecovery: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signInWithGoogle: () => Promise<AuthResponse>;
  signUp: (params: SignUpParams) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  uploadAvatar: (file: File) => Promise<{ error: string | null; url?: string }>;
  removeAvatar: () => Promise<{ error: string | null }>;
  updateProfile: (updates: { fullName?: string; businessName?: string; branchName?: string; location?: string }) => Promise<{ error: string | null }>;
  sendPasswordResetEmail: (email: string) => Promise<{ error: string | null }>;
  updateUserPassword: (password: string) => Promise<{ error: string | null }>;
  clearPasswordRecovery: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

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

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    // 1. Initial active session check
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (!error && initialSession) {
        setSession(initialSession);
        setUser(formatOwnerUser(initialSession.user));
      }
      setIsLoading(false);
    }).catch((err) => {
      console.error('Error fetching auth session:', err);
      setIsLoading(false);
    });

    // 2. Realtime auth state listener
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      setUser(formatOwnerUser(currentSession?.user || null));
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    if (!isConfigured) {
      return { error: 'Authentication is unavailable. Please contact the administrator.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        return { error: error.message };
      }

      if (data.session) {
        setSession(data.session);
        setUser(formatOwnerUser(data.session.user));
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred during sign in.' };
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

      // If Supabase has email confirmation enabled, session will be null until user clicks the email link
      const requiresEmailConfirmation = !data.session;
      if (data.session) {
        setSession(data.session);
        setUser(formatOwnerUser(data.session.user));
      }

      return { error: null, requiresEmailConfirmation };
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred during sign up.' };
    }
  };

  const signOut = async () => {
    try {
      if (isConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setSession(null);
      setUser(null);
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

      // Try uploading to Supabase Storage if configured
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

        // Update user metadata in Supabase Auth
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
        // Mock / offline fallback
        setUser((prev) => (prev ? { ...prev, avatarUrl: finalUrl } : null));
      }

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
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) {
        return { error: error.message };
      }
      setIsPasswordRecovery(false);
      // Clean up hash in URL if present
      if (typeof window !== 'undefined' && window.history) {
        window.history.replaceState(null, '', window.location.pathname);
      }
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
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        uploadAvatar,
        removeAvatar,
        updateProfile,
        sendPasswordResetEmail,
        updateUserPassword,
        clearPasswordRecovery
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
