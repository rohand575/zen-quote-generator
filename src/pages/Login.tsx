import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { authService } from '@/lib/auth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/', { replace: true });
      }
    });
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      await authService.signIn(email, password);
      toast.success('Welcome back to Zen Engineering!');
      navigate('/', { replace: true });
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--navy-dark))] via-[hsl(var(--background))] to-[hsl(var(--navy))] flex items-center justify-center p-4 relative overflow-hidden text-foreground">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-[hsl(var(--navy-light))]/15 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-[hsl(var(--navy))]/18 rounded-full blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl overflow-hidden border border-white/20 bg-white/5 backdrop-blur shadow-2xl hover:scale-105 transition-transform duration-300">
            <img src="/zen-logo.png" alt="Zen Engineering logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-5xl font-heading font-bold text-white mb-3 tracking-tight">Zen Engineering</h1>
          <p className="text-primary-foreground/90 text-lg font-medium">Quotation Management System</p>
        </div>

        {/* Login Card */}
        <Card className="border border-border/70 shadow-2xl backdrop-blur-md bg-card/90 animate-scale-in">
          <CardHeader className="space-y-3 pb-6">
            <CardTitle className="text-3xl font-heading text-foreground">Admin Login</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Sign in to manage quotations and clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@zenengineering.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 border-2 border-border/70 bg-background/80 focus:border-accent focus:ring-0 transition-colors"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 border-2 border-border/70 bg-background/80 focus:border-accent focus:ring-0 transition-colors"
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 premium-gradient-bg text-primary-foreground font-semibold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-muted-foreground text-sm mt-10 font-medium">
          (c) 2025 Zen Engineering. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
