import type { Quotation, QuotationLineItem, Item } from '@/types';

export interface ProfitMetrics {
  revenue: number;
  cost: number;
  grossProfit: number;
  profitMargin: number; // percentage
}

export interface QuotationProfit extends ProfitMetrics {
  quotation: Quotation;
  hasCompleteCostData: boolean;
}

export interface ClientProfit {
  clientId: string;
  clientName: string;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  quotationCount: number;
}

export interface CategoryProfit {
  category: string;
  revenue: number;
  cost: number;
  grossProfit: number;
  profitMargin: number;
  itemCount: number;
}

export interface MonthlyProfit {
  month: string;
  revenue: number;
  cost: number;
  grossProfit: number;
  profitMargin: number;
}

export interface LowMarginAlert {
  quotation: Quotation;
  profitMargin: number;
  revenue: number;
  status: 'critical' | 'warning' | 'low';
}

/**
 * Calculate profit metrics for a single quotation
 */
export const calculateQuotationProfit = (
  quotation: Quotation,
  items: Item[]
): QuotationProfit => {
  const lineItems = quotation.line_items as QuotationLineItem[];

  let totalCost = 0;
  let hasCompleteCostData = true;

  if (lineItems && Array.isArray(lineItems)) {
    lineItems.forEach((lineItem) => {
      // First check if line item has cost_price
      if (lineItem.cost_price && lineItem.cost_price > 0) {
        totalCost += lineItem.cost_price * lineItem.quantity;
      } else {
        // Fallback to items catalog
        const catalogItem = items.find(item => item.id === lineItem.item_id);
        if (catalogItem?.cost_price && catalogItem.cost_price > 0) {
          totalCost += catalogItem.cost_price * lineItem.quantity;
        } else {
          hasCompleteCostData = false;
        }
      }
    });
  }

  const revenue = Number(quotation.total);
  const grossProfit = revenue - totalCost;
  const profitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  return {
    quotation,
    revenue,
    cost: totalCost,
    grossProfit,
    profitMargin,
    hasCompleteCostData,
  };
};

/**
 * Calculate profit by client
 */
export const calculateClientProfits = (
  quotations: Quotation[],
  items: Item[],
  clients: any[]
): ClientProfit[] => {
  const clientMap = new Map<string, ClientProfit>();

  quotations
    .filter(q => q.status === 'accepted')
    .forEach(quotation => {
      const profit = calculateQuotationProfit(quotation, items);

      if (!clientMap.has(quotation.client_id)) {
        const client = clients.find(c => c.id === quotation.client_id);
        clientMap.set(quotation.client_id, {
          clientId: quotation.client_id,
          clientName: client?.name || 'Unknown',
          totalRevenue: 0,
          totalCost: 0,
          grossProfit: 0,
          profitMargin: 0,
          quotationCount: 0,
        });
      }

      const clientProfit = clientMap.get(quotation.client_id)!;
      clientProfit.totalRevenue += profit.revenue;
      clientProfit.totalCost += profit.cost;
      clientProfit.grossProfit += profit.grossProfit;
      clientProfit.quotationCount += 1;
    });

  // Calculate margin percentage
  clientMap.forEach(client => {
    client.profitMargin = client.totalRevenue > 0
      ? (client.grossProfit / client.totalRevenue) * 100
      : 0;
  });

  return Array.from(clientMap.values()).sort((a, b) => b.grossProfit - a.grossProfit);
};

/**
 * Calculate profit by category
 */
export const calculateCategoryProfits = (
  quotations: Quotation[],
  items: Item[]
): CategoryProfit[] => {
  const categoryMap = new Map<string, CategoryProfit>();

  quotations
    .filter(q => q.status === 'accepted')
    .forEach(quotation => {
      const lineItems = quotation.line_items as QuotationLineItem[];

      if (lineItems && Array.isArray(lineItems)) {
        lineItems.forEach(lineItem => {
          const catalogItem = items.find(item => item.id === lineItem.item_id);
          const category = catalogItem?.category || 'Uncategorized';

          if (!categoryMap.has(category)) {
            categoryMap.set(category, {
              category,
              revenue: 0,
              cost: 0,
              grossProfit: 0,
              profitMargin: 0,
              itemCount: 0,
            });
          }

          const categoryProfit = categoryMap.get(category)!;
          const revenue = lineItem.unit_price * lineItem.quantity;
          const cost = (lineItem.cost_price || catalogItem?.cost_price || 0) * lineItem.quantity;

          categoryProfit.revenue += revenue;
          categoryProfit.cost += cost;
          categoryProfit.grossProfit += revenue - cost;
          categoryProfit.itemCount += 1;
        });
      }
    });

  // Calculate margin percentage
  categoryMap.forEach(category => {
    category.profitMargin = category.revenue > 0
      ? (category.grossProfit / category.revenue) * 100
      : 0;
  });

  return Array.from(categoryMap.values()).sort((a, b) => b.grossProfit - a.grossProfit);
};

/**
 * Calculate monthly profit trends
 */
export const calculateMonthlyProfits = (
  quotations: Quotation[],
  items: Item[],
  months: number = 6
): MonthlyProfit[] => {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const monthlyData: MonthlyProfit[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(thisYear, thisMonth - i, 1);
    const monthQuotes = quotations.filter(q => {
      const qDate = new Date(q.created_at);
      return qDate.getMonth() === date.getMonth() &&
             qDate.getFullYear() === date.getFullYear() &&
             q.status === 'accepted';
    });

    let revenue = 0;
    let cost = 0;

    monthQuotes.forEach(quotation => {
      const profit = calculateQuotationProfit(quotation, items);
      revenue += profit.revenue;
      cost += profit.cost;
    });

    const grossProfit = revenue - cost;
    const profitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    monthlyData.push({
      month: date.toLocaleDateString('en-IN', { month: 'short' }),
      revenue,
      cost,
      grossProfit,
      profitMargin,
    });
  }

  return monthlyData;
};

/**
 * Identify low-margin quotations
 */
export const findLowMarginQuotations = (
  quotations: Quotation[],
  items: Item[],
  thresholds = { critical: 10, warning: 20, low: 30 }
): LowMarginAlert[] => {
  const alerts: LowMarginAlert[] = [];

  quotations
    .filter(q => q.status === 'accepted' || q.status === 'sent')
    .forEach(quotation => {
      const profit = calculateQuotationProfit(quotation, items);

      if (!profit.hasCompleteCostData) return;

      let status: 'critical' | 'warning' | 'low' | null = null;

      if (profit.profitMargin < thresholds.critical) {
        status = 'critical';
      } else if (profit.profitMargin < thresholds.warning) {
        status = 'warning';
      } else if (profit.profitMargin < thresholds.low) {
        status = 'low';
      }

      if (status) {
        alerts.push({
          quotation,
          profitMargin: profit.profitMargin,
          revenue: profit.revenue,
          status,
        });
      }
    });

  return alerts.sort((a, b) => a.profitMargin - b.profitMargin);
};

/**
 * Calculate overall profit metrics
 */
export const calculateOverallProfitMetrics = (
  quotations: Quotation[],
  items: Item[]
): ProfitMetrics & { quotationCount: number } => {
  let totalRevenue = 0;
  let totalCost = 0;
  let quotationCount = 0;

  quotations
    .filter(q => q.status === 'accepted')
    .forEach(quotation => {
      const profit = calculateQuotationProfit(quotation, items);
      totalRevenue += profit.revenue;
      totalCost += profit.cost;
      quotationCount += 1;
    });

  const grossProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  return {
    revenue: totalRevenue,
    cost: totalCost,
    grossProfit,
    profitMargin,
    quotationCount,
  };
};
