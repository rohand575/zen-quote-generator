import { Link } from 'react-router-dom';
import { FileText, Users, Package, Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Quotation, Client } from '@/types';

const Dashboard = () => {
  const { data: quotations = [], isLoading: quotationsLoading } = useQuery({
    queryKey: ['quotations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Quotation[];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*');
      
      if (error) throw error;
      return data as Client[];
    },
  });

  const { data: itemsCount = 0 } = useQuery({
    queryKey: ['items-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  const recentQuotations = quotations.slice(0, 5);
  const totalRevenue = quotations.reduce((sum, q) => sum + Number(q.total), 0);

  const stats = [
    { label: 'Total Quotations', value: quotations.length.toString(), icon: FileText, change: '+12%' },
    { label: 'Active Clients', value: clients.length.toString(), icon: Users, change: '+5%' },
    { label: 'Catalog Items', value: itemsCount.toString(), icon: Package, change: '+8%' },
    { 
      label: 'Revenue (Est.)', 
      value: new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
        notation: 'compact',
        compactDisplay: 'short'
      }).format(totalRevenue), 
      icon: TrendingUp, 
      change: '+18%' 
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
      draft: { variant: "secondary", className: "bg-muted" },
      sent: { variant: "default", className: "bg-primary" },
      accepted: { variant: "default", className: "bg-green-600" },
      rejected: { variant: "destructive", className: "" },
    };
    
    return (
      <Badge variant={variants[status]?.variant || "default"} className={variants[status]?.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  if (quotationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-heading font-bold text-foreground mb-2 tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-lg">Welcome back! Here's an overview of your quotations.</p>
        </div>
        <Link to="/quotations/create">
          <Button className="premium-gradient-accent text-accent-foreground gap-2 h-11 px-6 font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
            <Plus className="h-5 w-5" />
            New Quotation
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={stat.label} 
              className="premium-card glass-card accent-glow group cursor-pointer hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide tracking-[0.08em]">
                  {stat.label}
                </CardTitle>
                <div className="p-2 rounded-lg bg-[hsl(var(--accent))]/10 group-hover:bg-[hsl(var(--accent))]/20 transition-colors">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-heading font-bold text-foreground mb-2">{stat.value}</div>
                <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Quotations */}
      <Card className="premium-card glass-card accent-glow animate-slide-up">
        <CardHeader className="border-b soft-divider pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-heading">Recent Quotations</CardTitle>
            <Link to="/quotations">
              <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground transition-all">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {recentQuotations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No quotations yet. Create your first one!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b soft-divider bg-[hsl(var(--navy))/0.14]">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground tracking-wide uppercase">Quote #</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground tracking-wide uppercase">Client</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground tracking-wide uppercase">Project</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground tracking-wide uppercase">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground tracking-wide uppercase">Status</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground tracking-wide uppercase">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentQuotations.map((quote) => (
                    <tr key={quote.id} className="border-b soft-divider hover:bg-[hsl(var(--card))/0.6] transition-all duration-200 group">
                      <td className="py-5 px-4">
                        <Link to={`/quotations/${quote.id}/print`} className="text-primary hover:text-accent font-mono text-sm font-semibold transition-colors">
                          {quote.quotation_number}
                        </Link>
                      </td>
                      <td className="py-5 px-4 text-sm font-medium">{getClientName(quote.client_id)}</td>
                      <td className="py-5 px-4 text-sm group-hover:text-foreground transition-colors">{quote.project_title}</td>
                      <td className="py-5 px-4 text-sm text-muted-foreground">
                        {new Date(quote.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-5 px-4">{getStatusBadge(quote.status)}</td>
                      <td className="py-5 px-4 text-right font-mono font-semibold text-base">{formatCurrency(Number(quote.total))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
