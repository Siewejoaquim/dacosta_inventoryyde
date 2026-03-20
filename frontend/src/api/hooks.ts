import { useQuery } from '@tanstack/react-query';
import api from './client';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const [productsRes, weeklyRes, monthlyRes, invoicesRes, expensesTodayRes, expensesWeeklyRes, expensesMonthlyRes] = await Promise.all([
        api.get('/products'),
        api.get('/reports/weekly'),
        api.get('/reports/monthly'),
        api.get('/invoices'),
        api.get('/expenses/today'),
        api.get('/expenses/summary?period=monthly').catch(() => ({ data: { total: 0 } })),
        api.get('/expenses/summary?period=monthly').catch(() => ({ data: { total: 0 } })),
      ]);

      const products = productsRes.data as any[];
      const weekly = weeklyRes.data as any;
      const monthly = monthlyRes.data as any;
      const invoices = invoicesRes.data as any[];
      const expensesToday = (expensesTodayRes.data as any[]).reduce((s: number, e: any) => s + e.amount, 0);

      // weekly expenses — derive from today's expenses list as approximation for staff
      // admin gets full summary separately
      const expensesMonthly = expensesMonthlyRes.data?.total ?? 0;

      const today = new Date();
      const todaysSales = invoices
        .filter((inv) => {
          const d = new Date(inv.dateCreated);
          return (
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate()
          );
        })
        .reduce((sum, inv) => sum + inv.totalAmount, 0);

      // weekly expenses from weekly report range
      const weekStart = weekly.start ? new Date(weekly.start) : today;
      const weekEnd = weekly.end ? new Date(weekly.end) : today;

      return {
        totalProducts: products.length,
        totalSalesToday: todaysSales,
        expensesToday,
        netToday: todaysSales - expensesToday,
        weeklySales: weekly.totalSales,
        monthlyRevenue: monthly.totalMonthlyRevenue,
        expensesMonthly,
        netMonthly: monthly.totalMonthlyRevenue - expensesMonthly,
        lowStock: products.filter((p) => p.quantityInStock < (p.reorderPoint ?? 5)),
        recentInvoices: invoices.slice(0, 5),
        weekStart,
        weekEnd,
      };
    },
  });
}
