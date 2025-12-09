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
      {/* Enhanced Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-[hsl(var(--navy-light))]/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-[hsl(var(--navy))]/25 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[hsl(var(--accent))]/10 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-3xl overflow-hidden border-2 border-white/30 bg-white/10 backdrop-blur-xl shadow-2xl hover:scale-110 transition-all duration-500 animate-glow-pulse mb-6">
            <img src="/zen-logo.png" alt="Zen Engineering logo" className="w-full h-full object-contain p-2" />
          </div>
          <h1 className="text-5xl font-heading font-bold text-white mb-4 tracking-tight text-shimmer">Zen Engineering</h1>
          <p className="text-primary-foreground/95 text-xl font-semibold">Quotation Management System</p>
        </div>

        {/* Login Card */}
        <Card className="premium-card glass-card luxury-border shadow-2xl animate-scale-in">
          <CardHeader className="space-y-4 pb-8">
            <CardTitle className="text-3xl font-heading font-bold text-foreground">Admin Login</CardTitle>
            <CardDescription className="text-base text-muted-foreground font-medium">
              Sign in to manage quotations and clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@zenengineering.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 border-2 border-border/60 bg-background/90 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-300 rounded-xl font-medium"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 border-2 border-border/60 bg-background/90 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-300 rounded-xl font-medium"
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full h-13 premium-gradient-accent text-accent-foreground font-bold text-base shadow-xl hover:shadow-2xl interactive-lift rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-primary-foreground/80 text-sm mt-12 font-semibold">
          © 2025 Zen Engineering. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
