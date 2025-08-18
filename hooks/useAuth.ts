import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { authService, RegisterData, LoginData } from '@/services/authService';
import { Profile } from '@/services/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<Profile, 'firstName' | 'lastName'>>) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // Get current session
      const { session: currentSession, error } = await authService.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        return;
      }

      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);
        
        // Get user profile
        const userProfile = await authService.getProfile(currentSession.user.id);
        setProfile(userProfile);
      }

      // Listen for auth changes
      const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const userProfile = await authService.getProfile(session.user.id);
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
      });

      // Cleanup subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: LoginData): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const result = await authService.login(data);
      
      if (result.error) {
        return { success: false, error: result.error };
      }
      
      // State will be updated by the auth state change listener
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred during login' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const result = await authService.register(data);
      
      if (result.error) {
        return { success: false, error: result.error };
      }
      
      // State will be updated by the auth state change listener
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'An unexpected error occurred during registration' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      const { error } = await authService.logout();
      
      if (error) {
        console.error('Logout error:', error);
      }
      
      // State will be updated by the auth state change listener
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Pick<Profile, 'firstName' | 'lastName'>>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: 'No user logged in' };
      }

      const result = await authService.updateProfile(user.id, updates);
      
      if (result.error) {
        return { success: false, error: result.error };
      }
      
      if (result.profile) {
        setProfile(result.profile);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'An unexpected error occurred while updating profile' };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await authService.resetPassword(email);
      
      if (error) {
        return { success: false, error };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: 'An unexpected error occurred while resetting password' };
    }
  };

  return {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated: !!user && !!session,
    login,
    register,
    logout,
    updateProfile,
    resetPassword,
  };
};

export { AuthContext };