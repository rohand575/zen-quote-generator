import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Percent, PieChart as PieChartIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import type { Quotation, Item, Client } from '@/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import {
  calculateOverallProfitMetrics,
  calculateMonthlyProfits,
  calculateCategoryProfits,
  calculateClientProfits,
  findLowMarginQuotations,
} from '@/lib/profitCalculations';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Link } from 'react-router-dom';

const ProfitMarginAnalytics = () => {
  // Fetch data
  const { data: quotations = [] } = useQuery<Quotation[]>({
    queryKey: ['quotations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('quotations').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: items = [] } = useQuery<Item[]>({
    queryKey: ['items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('items').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*');
      if (error) throw error;
      return data;
    },
  });

  // Calculate metrics
  const analytics = useMemo(() => {
    if (!quotations.length || !items.length) {
      return {
        overall: { revenue: 0, cost: 0, grossProfit: 0, profitMargin: 0, quotationCount: 0 },
        monthly: [],
        categories: [],
        topClients: [],
        lowMarginAlerts: [],
      };
    }

    const overall = calculateOverallProfitMetrics(quotations, items);
    const monthly = calculateMonthlyProfits(quotations, items, 6);
    const categories = calculateCategoryProfits(quotations, items).slice(0, 6);
    const topClients = calculateClientProfits(quotations, items, clients).slice(0, 5);
    const lowMarginAlerts = findLowMarginQuotations(quotations, items);

    return {
      overall,
      monthly,
      categories,
      topClients,
      lowMarginAlerts,
    };
  }, [quotations, items, clients]);

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
      maximumFractionDigits: 1,
      notation: 'compact',
      compactDisplay: 'short'
    }).format(amount);
  };

  const chartConfig = {
    revenue: { label: 'Revenue', color: 'hsl(var(--primary))' },
    cost: { label: 'Cost', color: 'hsl(var(--destructive))' },
    grossProfit: { label: 'Gross Profit', color: 'hsl(142, 76%, 36%)' },
    profitMargin: { label: 'Margin %', color: 'hsl(var(--accent))' },
  };

  // Category colors for heatmap
  const getCategoryColor = (margin: number) => {
    if (margin >= 40) return 'hsl(142, 76%, 36%)'; // Green
    if (margin >= 30) return 'hsl(173, 58%, 39%)'; // Teal
    if (margin >= 20) return 'hsl(48, 96%, 53%)'; // Yellow
    if (margin >= 10) return 'hsl(25, 95%, 53%)'; // Orange
    return 'hsl(var(--destructive))'; // Red
  };

  const getMarginBadge = (margin: number) => {
    if (margin >= 40) return { variant: 'default' as const, className: 'bg-green-600', label: 'Excellent' };
    if (margin >= 30) return { variant: 'default' as const, className: 'bg-blue-600', label: 'Good' };
    if (margin >= 20) return { variant: 'default' as const, className: 'bg-yellow-600', label: 'Fair' };
    if (margin >= 10) return { variant: 'default' as const, className: 'bg-orange-600', label: 'Low' };
    return { variant: 'destructive' as const, className: '', label: 'Critical' };
  };

  const getAlertVariant = (status: 'critical' | 'warning' | 'low') => {
    if (status === 'critical') return 'destructive';
    return 'default';
  };

  if (!quotations.length || !items.length) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-heading font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Profit Margin Analytics
          </h2>
          <p className="text-muted-foreground mt-1">Track profitability and margins</p>
        </div>

        <Card className="premium-card glass-card luxury-border">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No profit data available</p>
              <p className="text-sm">Add cost prices to items and create accepted quotations to see analytics</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-heading font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Profit Margin Analytics
        </h2>
        <p className="text-muted-foreground mt-1">Track profitability across quotations, clients, and categories</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Gross Profit */}
        <Card className="premium-card glass-card luxury-border group hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b soft-divider">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Gross Profit
            </CardTitle>
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 group-hover:from-green-500/30 group-hover:to-green-600/20 transition-all shadow-md">
              <DollarSign className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-heading font-bold text-foreground mb-2">
              {formatCompactCurrency(analytics.overall.grossProfit)}
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              From {analytics.overall.quotationCount} accepted quotations
            </p>
          </CardContent>
        </Card>

        {/* Profit Margin */}
        <Card className="premium-card glass-card luxury-border group hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b soft-divider">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Avg. Profit Margin
            </CardTitle>
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-all shadow-md">
              <Percent className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-heading font-bold text-foreground mb-2">
              {analytics.overall.profitMargin.toFixed(1)}%
            </div>
            <div className="flex items-center gap-2">
              <Badge {...getMarginBadge(analytics.overall.profitMargin)} className={getMarginBadge(analytics.overall.profitMargin).className}>
                {getMarginBadge(analytics.overall.profitMargin).label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Total Cost */}
        <Card className="premium-card glass-card luxury-border group hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b soft-divider">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Total Cost
            </CardTitle>
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 group-hover:from-orange-500/30 group-hover:to-orange-600/20 transition-all shadow-md">
              <TrendingDown className="h-5 w-5 text-orange-600 group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-heading font-bold text-foreground mb-2">
              {formatCompactCurrency(analytics.overall.cost)}
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Revenue: {formatCompactCurrency(analytics.overall.revenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Margin Alerts */}
      {analytics.lowMarginAlerts.length > 0 && (
        <Alert variant={getAlertVariant(analytics.lowMarginAlerts[0].status)} className="border-2">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="font-semibold text-lg">Low Margin Alerts</AlertTitle>
          <AlertDescription>
            <p className="mb-3">You have {analytics.lowMarginAlerts.length} quotation(s) with low profit margins:</p>
            <div className="space-y-2">
              {analytics.lowMarginAlerts.slice(0, 3).map((alert) => (
                <div key={alert.quotation.id} className="flex items-center justify-between bg-background/50 rounded-lg p-3">
                  <div>
                    <Link to={`/quotations/${alert.quotation.id}/print`} className="font-medium hover:underline">
                      {alert.quotation.quotation_number}
                    </Link>
                    <p className="text-sm text-muted-foreground">{alert.quotation.project_title}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-destructive">{alert.profitMargin.toFixed(1)}% margin</div>
                    <div className="text-sm text-muted-foreground">{formatCurrency(alert.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
            {analytics.lowMarginAlerts.length > 3 && (
              <p className="text-sm text-muted-foreground mt-2">
                + {analytics.lowMarginAlerts.length - 3} more quotations
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Margin Trend */}
        <Card className="premium-card glass-card luxury-border">
          <CardHeader className="border-b soft-divider pb-5">
            <CardTitle className="text-2xl font-heading font-bold">Margin Trend</CardTitle>
            <CardDescription className="text-base">Monthly profit margins over time</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <AreaChart data={analytics.monthly}>
                <defs>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
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
                  tickFormatter={(value) => `${value}%`}
                />
                <ChartTooltip
                  content={<ChartTooltipContent
                    formatter={(value) => `${Number(value).toFixed(1)}%`}
                  />}
                />
                <Area
                  type="monotone"
                  dataKey="profitMargin"
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={2}
                  fill="url(#profitGradient)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue vs Cost */}
        <Card className="premium-card glass-card luxury-border">
          <CardHeader className="border-b soft-divider pb-5">
            <CardTitle className="text-2xl font-heading font-bold">Revenue vs Cost</CardTitle>
            <CardDescription className="text-base">Monthly comparison over 6 months</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <BarChart data={analytics.monthly}>
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
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="cost" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Cost" />
                <Bar dataKey="grossProfit" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} name="Profit" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Profitability & Top Clients */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Profitability Heatmap */}
        <Card className="premium-card glass-card luxury-border">
          <CardHeader className="border-b soft-divider pb-5">
            <CardTitle className="text-2xl font-heading font-bold flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Category Profitability
            </CardTitle>
            <CardDescription className="text-base">Profit margins by item category</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {analytics.categories.length > 0 ? (
              <div className="space-y-3">
                {analytics.categories.map((category) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getCategoryColor(category.profitMargin) }}
                        />
                        <span className="font-medium">{category.category}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-semibold">{formatCompactCurrency(category.grossProfit)}</span>
                        <Badge variant="outline" className="font-mono">
                          {category.profitMargin.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(category.profitMargin, 100)}%`,
                          backgroundColor: getCategoryColor(category.profitMargin)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <p>No category data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Clients by Profit */}
        <Card className="premium-card glass-card luxury-border">
          <CardHeader className="border-b soft-divider pb-5">
            <CardTitle className="text-2xl font-heading font-bold">Top Clients by Profit</CardTitle>
            <CardDescription className="text-base">Most profitable client relationships</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {analytics.topClients.length > 0 ? (
              <div className="space-y-4">
                {analytics.topClients.map((client, index) => (
                  <div key={client.clientId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium">
                          {index + 1}
                        </span>
                        <span className="font-medium truncate max-w-[180px]">{client.clientName}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-semibold text-green-600">
                          {formatCompactCurrency(client.grossProfit)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {client.profitMargin.toFixed(1)}% margin
                        </div>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min((client.grossProfit / analytics.topClients[0].grossProfit) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <p>No client profit data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfitMarginAnalytics;
