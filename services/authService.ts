import { supabase, Profile } from './supabase';
import { AuthError, User, Session } from '@supabase/supabase-js';

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  error: string | null;
}

class AuthService {
  /**
   * Register a new user with Supabase Auth and create profile
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // 1. Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        console.error('Registration auth error:', authError);
        return {
          user: null,
          profile: null,
          session: null,
          error: this.getErrorMessage(authError),
        };
      }

      if (!authData.user) {
        return {
          user: null,
          profile: null,
          session: null,
          error: 'Registration failed - no user returned',
        };
      }

      // 2. Create user profile in profiles table
      const profileData = {
        id: authData.user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      };

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // If profile creation fails, we should clean up the auth user
        await supabase.auth.signOut();
        return {
          user: null,
          profile: null,
          session: null,
          error: 'Failed to create user profile. Please try again.',
        };
      }

      return {
        user: authData.user,
        profile,
        session: authData.session,
        error: null,
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        user: null,
        profile: null,
        session: null,
        error: 'An unexpected error occurred during registration',
      };
    }
  }

  /**
   * Login user with email and password
   */
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        console.error('Login error:', authError);
        return {
          user: null,
          profile: null,
          session: null,
          error: this.getErrorMessage(authError),
        };
      }

      if (!authData.user) {
        return {
          user: null,
          profile: null,
          session: null,
          error: 'Login failed - no user returned',
        };
      }

      // Fetch user profile
      const profile = await this.getProfile(authData.user.id);

      return {
        user: authData.user,
        profile,
        session: authData.session,
        error: null,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        user: null,
        profile: null,
        session: null,
        error: 'An unexpected error occurred during login',
      };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        return { error: this.getErrorMessage(error) };
      }
      return { error: null };
    } catch (error) {
      console.error('Logout error:', error);
      return { error: 'An unexpected error occurred during logout' };
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<{ session: Session | null; error: string | null }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Get session error:', error);
        return { session: null, error: this.getErrorMessage(error) };
      }
      return { session, error: null };
    } catch (error) {
      console.error('Get session error:', error);
      return { session: null, error: 'Failed to get session' };
    }
  }

  /**
   * Get user profile by user ID
   */
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Get profile error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Get profile error:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<Pick<Profile, 'firstName' | 'lastName'>>): Promise<{ profile: Profile | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Update profile error:', error);
        return { profile: null, error: 'Failed to update profile' };
      }

      return { profile: data, error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { profile: null, error: 'An unexpected error occurred while updating profile' };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'your-app://reset-password',
      });

      if (error) {
        console.error('Reset password error:', error);
        return { error: this.getErrorMessage(error) };
      }

      return { error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: 'An unexpected error occurred while resetting password' };
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Convert Supabase auth errors to user-friendly messages
   */
  private getErrorMessage(error: AuthError): string {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'User already registered':
        return 'An account with this email already exists. Please try logging in instead.';
      case 'Email not confirmed':
        return 'Please check your email and click the confirmation link before logging in.';
      case 'Password should be at least 6 characters':
        return 'Password must be at least 6 characters long.';
      case 'Unable to validate email address: invalid format':
        return 'Please enter a valid email address.';
      case 'signup is disabled':
        return 'New registrations are currently disabled. Please contact support.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }
}

export const authService = new AuthService();