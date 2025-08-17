import { adminOrdersService, type AdminOrderDTO } from './adminOrdersService';

export interface SalesTimeSeriesPoint {
  timestamp: string; // ISO date-time string for the bucket (local midnight)
  count: number;     // number of sales/orders in the bucket
  amount?: number;   // optional revenue amount in the bucket
}

export interface SalesSummary {
  ordersCount: number;
  totalAmount: number;
}

// Helper: format date key YYYY-MM-DD in local time
const dateKey = (d: Date): string => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Helper: pick the best timestamp from an order
const pickOrderTimestamp = (o: AdminOrderDTO): string | null => {
  if (typeof o.orderDate === 'string' && o.orderDate) return o.orderDate;
  if (typeof o.paymentDate === 'string' && o.paymentDate) return o.paymentDate;
  const rec = o as Record<string, unknown>;
  const createdAt = rec['createdAt'];
  if (typeof createdAt === 'string' && createdAt) return createdAt;
  const updatedAt = rec['updatedAt'];
  if (typeof updatedAt === 'string' && updatedAt) return updatedAt;
  return null;
};

// Helper: pick numeric total amount from an order
const pickOrderAmount = (o: AdminOrderDTO): number => {
  if (typeof o.totalAmount === 'number') return o.totalAmount;
  const rec = o as Record<string, unknown>;
  const maybe = rec['amount'];
  const n = typeof maybe === 'number' ? maybe : (typeof maybe === 'string' ? Number(maybe) : 0);
  return Number.isFinite(n) ? n : 0;
};

export const salesService = {
  async getSalesTimeSeries(days: number = 30): Promise<SalesTimeSeriesPoint[]> {
    try {
      // Prepare day buckets for continuity
      const now = new Date();
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);

      const keys: string[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(startOfToday);
        d.setDate(d.getDate() - i);
        keys.push(dateKey(d));
      }

      const counts = new Map<string, number>();
      const amounts = new Map<string, number>();
      keys.forEach(k => { counts.set(k, 0); amounts.set(k, 0); });

      // Fetch all orders (admin endpoint)
      const orders: AdminOrderDTO[] = await adminOrdersService.getAllOrders();

      // Filter and aggregate orders into day buckets
      for (const o of orders) {
        const ts = pickOrderTimestamp(o);
        if (!ts) continue;
        const dt = new Date(ts);
        if (!Number.isFinite(dt.getTime())) continue;

        // Only include orders within the last `days` days (inclusive)
        const k = dateKey(dt);
        if (!counts.has(k)) continue;

        // Optional: consider only successful/paid statuses if present
        const status = (o.status ?? '').toString().toLowerCase();
        const isCancelled = /cancel|void|refunded/i.test(status);
        if (isCancelled) continue;

        counts.set(k, (counts.get(k) || 0) + 1);
        amounts.set(k, (amounts.get(k) || 0) + pickOrderAmount(o));
      }

      // Build series
      const series: SalesTimeSeriesPoint[] = keys.map(k => {
        const [Y, M, D] = k.split('-').map(Number);
        const localMidnight = new Date(Y, (M as number) - 1, D as number, 0, 0, 0, 0);
        return {
          timestamp: localMidnight.toISOString(),
          count: counts.get(k) || 0,
          amount: amounts.get(k) || 0,
        };
      });

      return series;
    } catch (err) {
      console.error('Failed to compute sales time series from orders:', err);
      // Fallback: zero series
      const now = new Date();
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      const series: SalesTimeSeriesPoint[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(startOfToday);
        d.setDate(d.getDate() - i);
        series.push({ timestamp: d.toISOString(), count: 0, amount: 0 });
      }
      return series;
    }
  },

  async getSalesSummary(days: number = 30): Promise<SalesSummary> {
    const series = await this.getSalesTimeSeries(days);
    const ordersCount = series.reduce((sum, p) => sum + (p.count || 0), 0);
    const totalAmount = series.reduce((sum, p) => sum + (p.amount || 0), 0);
    return { ordersCount, totalAmount };
  }
};
