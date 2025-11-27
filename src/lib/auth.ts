import { supabase } from '@/integrations/supabase/client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export const authService = {
  signUp: async (email: string, password: string): Promise<AuthUser> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    if (!data.user) throw new Error('User creation failed');
    
    return {
      id: data.user.id,
      email: data.user.email!,
      name: data.user.email!.split('@')[0],
    };
  },

  signIn: async (email: string, password: string): Promise<AuthUser> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    if (!data.user) throw new Error('Sign in failed');
    
    return {
      id: data.user.id,
      email: data.user.email!,
      name: data.user.email!.split('@')[0],
    };
  },
  
  signOut: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  
  getUser: async (): Promise<AuthUser | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email!,
      name: user.email!.split('@')[0],
    };
  },
  
  isAuthenticated: async (): Promise<boolean> => {
    const user = await authService.getUser();
    return !!user;
  },

  // Synchronous version for ProtectedRoute
  getCurrentSession: () => {
    return supabase.auth.getSession();
  }
};
