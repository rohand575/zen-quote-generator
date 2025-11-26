const AUTH_KEY = 'zen_auth';

export interface AuthUser {
  email: string;
  name: string;
}

export const authService = {
  login: (email: string): AuthUser => {
    const user: AuthUser = { email, name: email.split('@')[0] };
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return user;
  },
  
  logout: () => {
    localStorage.removeItem(AUTH_KEY);
  },
  
  getUser: (): AuthUser | null => {
    const stored = localStorage.getItem(AUTH_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },
  
  isAuthenticated: (): boolean => {
    return !!authService.getUser();
  }
};
