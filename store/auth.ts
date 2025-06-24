import { create } from 'zustand';
import { User, UserRole } from '../types';
import { toast } from 'react-hot-toast';
import i18next from 'i18next';
import { supabase } from '../lib/supabase';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  setUser: (user: User | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  updateUserLanguage: (language: string) => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  user: null,
  isLoading: false,
  error: null,

  setUser: (user) => {
    set({ 
      user, 
      isAuthenticated: !!user,
      error: null
    });
    
    // Set language based on user preference
    if (user?.preferredLanguage) {
      i18next.changeLanguage(user.preferredLanguage);
    }
  },

  signIn: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      
      // Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error('No user returned from authentication');
      }
      
      // Get user profile from database
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      if (profileError) throw profileError;
      
      // Create user object
      const user: User = {
        id: authData.user.id,
        email: authData.user.email!,
        role: profileData.role,
        name: profileData.name,
        restaurantId: profileData.restaurant_id,
        defaultLocationId: profileData.default_location_id,
        locationId: profileData.location_id,
        parentUserId: profileData.parent_user_id,
        managedRestaurantIds: profileData.managed_restaurant_ids,
        preferredLanguage: profileData.preferred_language || 'en',
        createdAt: new Date(profileData.created_at),
        lastLoginAt: profileData.last_login_at ? new Date(profileData.last_login_at) : undefined
      };
      
      set({ 
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      // Set language based on user preference
      if (user.preferredLanguage) {
        i18next.changeLanguage(user.preferredLanguage);
      }
      
      // Update last login time
      await supabase
        .from('user_profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id);
      
      toast.success(i18next.t('auth.signIn'));
    } catch (error) {
      set({ error: error as Error, isLoading: false, isAuthenticated: false, user: null });
      toast.error(error instanceof Error ? error.message : i18next.t('auth.invalidCredentials'));
    }
  },

  signUp: async (email, password, name, role) => {
    try {
      set({ isLoading: true, error: null });
      
      // Sign up with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role
          }
        }
      });
      
      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error('No user returned from sign up');
      }
      
      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          name,
          role,
          created_at: new Date().toISOString()
        });
      
      if (profileError) throw profileError;
      
      set({ isLoading: false });
      
      toast.success('Account created successfully. Please check your email for verification.');
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      toast.error(error instanceof Error ? error.message : 'Failed to create account');
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Sign out with Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      set({ user: null, isAuthenticated: false, isLoading: false });
      toast.success(i18next.t('auth.signOut'));
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      toast.error(i18next.t('common.error'));
    }
  },

  updateUserRole: async (userId: string, role: UserRole) => {
    try {
      set({ isLoading: true, error: null });
      
      // Update user role in database
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          role,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      // If updating the current user, update the local state
      if (get().user?.id === userId) {
        set(state => ({
          user: state.user ? { ...state.user, role } : null,
          isLoading: false
        }));
      } else {
        set({ isLoading: false });
      }

      toast.success(i18next.t('common.success'));
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      toast.error(i18next.t('common.error'));
    }
  },

  updateUserLanguage: async (language: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // Change language
      await i18next.changeLanguage(language);
      
      // Update user in database if authenticated
      const user = get().user;
      if (user) {
        const { error } = await supabase
          .from('user_profiles')
          .update({ 
            preferred_language: language,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (error) throw error;
        
        // Update user in state
        set(state => ({
          user: state.user ? { ...state.user, preferredLanguage: language } : null,
          isLoading: false
        }));
      } else {
        set({ isLoading: false });
      }
      
      toast.success(i18next.t('common.success'));
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      toast.error(i18next.t('common.error'));
    }
  },

  resetPasswordForEmail: async (email: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // Request password reset with Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) throw error;
      
      set({ isLoading: false });
      
      toast.success('Password reset instructions sent to your email');
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      toast.error(error instanceof Error ? error.message : 'Failed to send password reset email');
    }
  }
}));