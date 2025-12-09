import { Link } from 'react-router-dom';
import { FileText, Users, Package, Plus, TrendingUp, TrendingDown, DollarSign, CheckCircle, Clock, XCircle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Quotation, Client } from '@/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useMemo } from 'react';

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

  // Analytics calculations
  const analytics = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    // Status counts
    const statusCounts = quotations.reduce((acc, q) => {
      acc[q.status] = (acc[q.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Monthly revenue data (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(thisYear, thisMonth - i, 1);
      const monthQuotes = quotations.filter(q => {
        const qDate = new Date(q.created_at);
        return qDate.getMonth() === date.getMonth() && qDate.getFullYear() === date.getFullYear();
      });
      
      monthlyData.push({
        month: date.toLocaleDateString('en-IN', { month: 'short' }),
        revenue: monthQuotes.reduce((sum, q) => sum + Number(q.total), 0),
        count: monthQuotes.length,
        accepted: monthQuotes.filter(q => q.status === 'accepted').length,
      });
    }

    // Conversion rate
    const totalQuotes = quotations.length;
    const acceptedQuotes = statusCounts['accepted'] || 0;
    const conversionRate = totalQuotes > 0 ? ((acceptedQuotes / totalQuotes) * 100).toFixed(1) : '0';

    // Top clients by revenue
    const clientRevenue = quotations.reduce((acc, q) => {
      if (q.status === 'accepted') {
        acc[q.client_id] = (acc[q.client_id] || 0) + Number(q.total);
      }
      return acc;
    }, {} as Record<string, number>);

    const topClients = Object.entries(clientRevenue)
      .map(([id, revenue]) => ({
        id,
        name: clients.find(c => c.id === id)?.name || 'Unknown',
        revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Average quotation value
    const avgQuotationValue = totalQuotes > 0 
      ? quotations.reduce((sum, q) => sum + Number(q.total), 0) / totalQuotes 
      : 0;

    // This month vs last month comparison
    const thisMonthQuotes = quotations.filter(q => {
      const qDate = new Date(q.created_at);
      return qDate.getMonth() === thisMonth && qDate.getFullYear() === thisYear;
    });
    const lastMonthQuotes = quotations.filter(q => {
      const qDate = new Date(q.created_at);
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
      return qDate.getMonth() === lastMonth && qDate.getFullYear() === lastMonthYear;
    });

    const thisMonthRevenue = thisMonthQuotes.reduce((sum, q) => sum + Number(q.total), 0);
    const lastMonthRevenue = lastMonthQuotes.reduce((sum, q) => sum + Number(q.total), 0);
    const revenueChange = lastMonthRevenue > 0 
      ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(0)
      : thisMonthRevenue > 0 ? '100' : '0';

    return {
      statusCounts,
      monthlyData,
      conversionRate,
      topClients,
      avgQuotationValue,
      thisMonthRevenue,
      revenueChange,
      totalRevenue: quotations.reduce((sum, q) => sum + Number(q.total), 0),
    };
  }, [quotations, clients]);

  const recentQuotations = quotations.slice(0, 5);

  const statusPieData = [
    { name: 'Draft', value: analytics.statusCounts['draft'] || 0, color: 'hsl(var(--muted-foreground))' },
    { name: 'Sent', value: analytics.statusCounts['sent'] || 0, color: 'hsl(var(--primary))' },
    { name: 'Accepted', value: analytics.statusCounts['accepted'] || 0, color: 'hsl(142, 76%, 36%)' },
    { name: 'Rejected', value: analytics.statusCounts['rejected'] || 0, color: 'hsl(var(--destructive))' },
  ].filter(d => d.value > 0);

  const chartConfig = {
    revenue: { label: 'Revenue', color: 'hsl(var(--primary))' },
    count: { label: 'Quotations', color: 'hsl(var(--accent))' },
    accepted: { label: 'Accepted', color: 'hsl(142, 76%, 36%)' },
  };

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

  const formatCompactCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      notation: 'compact',
      compactDisplay: 'short'
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
          <p className="text-muted-foreground text-lg">Analytics overview of your quotation business.</p>
        </div>
        <Link to="/quotations/create">
          <Button className="premium-gradient-accent text-accent-foreground gap-2 h-11 px-6 font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
            <Plus className="h-5 w-5" />
            New Quotation
          </Button>
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="premium-card glass-card accent-glow group cursor-pointer hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Total Revenue
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-foreground mb-2">
              {formatCompactCurrency(analytics.totalRevenue)}
            </div>
            <p className={`text-sm font-medium flex items-center gap-1 ${Number(analytics.revenueChange) >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {Number(analytics.revenueChange) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {analytics.revenueChange}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="premium-card glass-card accent-glow group cursor-pointer hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Conversion Rate
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-foreground mb-2">
              {analytics.conversionRate}%
            </div>
            <p className="text-sm text-muted-foreground">
              {analytics.statusCounts['accepted'] || 0} of {quotations.length} accepted
            </p>
          </CardContent>
        </Card>

        <Card className="premium-card glass-card accent-glow group cursor-pointer hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Avg. Quote Value
            </CardTitle>
            <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
              <BarChart3 className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-foreground mb-2">
              {formatCompactCurrency(analytics.avgQuotationValue)}
            </div>
            <p className="text-sm text-muted-foreground">
              Per quotation average
            </p>
          </CardContent>
        </Card>

        <Card className="premium-card glass-card accent-glow group cursor-pointer hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Active Clients
            </CardTitle>
            <div className="p-2 rounded-lg bg-[hsl(var(--accent))]/10 group-hover:bg-[hsl(var(--accent))]/20 transition-colors">
              <Users className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-foreground mb-2">
              {clients.length}
            </div>
            <p className="text-sm text-muted-foreground">
              {itemsCount} catalog items
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Trend */}
        <Card className="premium-card glass-card lg:col-span-2">
          <CardHeader className="border-b soft-divider pb-4">
            <CardTitle className="text-xl font-heading">Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <AreaChart data={analytics.monthlyData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatCompactCurrency(value)}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent 
                    formatter={(value) => formatCurrency(Number(value))}
                  />} 
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="premium-card glass-card">
          <CardHeader className="border-b soft-divider pb-4">
            <CardTitle className="text-xl font-heading">Status Distribution</CardTitle>
            <CardDescription>Quotation status breakdown</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {statusPieData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No quotations yet
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {statusPieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-medium ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quotation Volume */}
        <Card className="premium-card glass-card">
          <CardHeader className="border-b soft-divider pb-4">
            <CardTitle className="text-xl font-heading">Quotation Volume</CardTitle>
            <CardDescription>Monthly quotations created vs accepted</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={analytics.monthlyData}>
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total" />
                <Bar dataKey="accepted" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} name="Accepted" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Clients */}
        <Card className="premium-card glass-card">
          <CardHeader className="border-b soft-divider pb-4">
            <CardTitle className="text-xl font-heading">Top Clients</CardTitle>
            <CardDescription>Clients by accepted quotation revenue</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {analytics.topClients.length > 0 ? (
              <div className="space-y-4">
                {analytics.topClients.map((client, index) => {
                  const maxRevenue = analytics.topClients[0]?.revenue || 1;
                  const percentage = (client.revenue / maxRevenue) * 100;
                  return (
                    <div key={client.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium">
                            {index + 1}
                          </span>
                          <span className="font-medium truncate max-w-[180px]">{client.name}</span>
                        </div>
                        <span className="font-mono font-semibold">{formatCurrency(client.revenue)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                <Users className="h-12 w-12 mb-2 opacity-50" />
                <p>No accepted quotations yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Quotations */}
      <Card className="premium-card glass-card accent-glow animate-slide-up">
        <CardHeader className="border-b soft-divider pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-heading">Recent Quotations</CardTitle>
              <CardDescription className="mt-1">Latest quotation activity</CardDescription>
            </div>
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