import { adminOrdersService, type AdminOrderDTO, type AdminOrderItem } from './adminOrdersService';

export interface SalesTimeSeriesPoint {
  timestamp: string; // ISO at local midnight for the day bucket
  count: number;     // orders count for the day
}

export interface SalesSummary {
  ordersCount: number;
  totalAmount: number;
  currency?: string;
}

const computeOrderAmount = (o: AdminOrderDTO): number => {
  if (typeof o.totalAmount === 'number' && isFinite(o.totalAmount)) return o.totalAmount;
  if (Array.isArray(o.orderItems)) {
    return o.orderItems.reduce((sum: number, it: AdminOrderItem) => {
      const qty = typeof it.quantity === 'number' && isFinite(it.quantity) ? it.quantity : 1;
      const price = typeof it.unitPrice === 'number' && isFinite(it.unitPrice)
        ? it.unitPrice
        : (typeof it.price === 'number' && isFinite(it.price) ? it.price : 0);
      return sum + qty * price;
    }, 0);
  }
  return 0;
};

// Choose a date to bucket the order into: prefer paymentDate, fallback to orderDate.
const getOrderDate = (o: AdminOrderDTO): Date | null => {
  const raw = o.paymentDate || o.orderDate;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
};

const dayKeyFromDate = (d: Date): string => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const salesService = {
  // Build a daily timeseries of order counts for the last `days` days (including today)
  async getSalesTimeSeries(days: number = 30): Promise<SalesTimeSeriesPoint[]> {
    const orders = await adminOrdersService.getAllOrders();

    // Prepare day buckets
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const dayKeys: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(startOfToday);
      d.setDate(d.getDate() - i);
      dayKeys.push(dayKeyFromDate(d));
    }

    const counts = new Map<string, number>();
    dayKeys.forEach(k => counts.set(k, 0));

    for (const o of orders) {
      const d = getOrderDate(o);
      if (!d) continue;
      const k = dayKeyFromDate(d);
      if (counts.has(k)) counts.set(k, (counts.get(k) || 0) + 1);
    }

    const series: SalesTimeSeriesPoint[] = dayKeys.map(k => {
      const [Y, M, D] = k.split('-').map(Number);
      const localMidnight = new Date(Y as number, (M as number) - 1, D as number, 0, 0, 0, 0);
      return {
        timestamp: localMidnight.toISOString(),
        count: counts.get(k) || 0,
      };
    });

    return series;
  },

  // Compute summary over last `days` days
  async getSalesSummary(days: number = 30): Promise<SalesSummary> {
    const orders = await adminOrdersService.getAllOrders();

    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    let ordersCount = 0;
    let totalAmount = 0;
    let currency: string | undefined = undefined;

    for (const o of orders) {
      const d = getOrderDate(o);
      if (!d) continue;
      if (d >= start && d <= now) {
        ordersCount += 1;
        totalAmount += computeOrderAmount(o);
        if (!currency && typeof o.currency === 'string') currency = o.currency;
      }
    }

    return { ordersCount, totalAmount, currency };
  },
};
