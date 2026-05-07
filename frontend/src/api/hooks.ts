import { useQuery } from '@tanstack/react-query';
import api from './client';
import { decodeToken } from './auth';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const user = decodeToken();
      const isAdmin = user?.role === 'ADMIN';

      // Staff don't have access to expenses/summary — only fetch it for admins
      const baseRequests = [
        api.get('/products'),
        api.get('/reports/weekly'),
        api.get('/reports/monthly'),
        api.get('/invoices'),
        api.get('/expenses/today'),
      ] as const;

      const [productsRes, weeklyRes, monthlyRes, invoicesRes, expensesTodayRes] =
        await Promise.all(baseRequests);

      // Only admins fetch the monthly expense summary
      const expensesMonthly = isAdmin
        ? await api.get('/expenses/summary', { params: { period: 'monthly' } })
            .then((r) => r.data?.total ?? 0)
            .catch(() => 0)
        : 0;

      const products = productsRes.data as any[];
      const weekly = weeklyRes.data as any;
      const monthly = monthlyRes.data as any;
      const invoices = invoicesRes.data as any[];
      const expensesToday = (expensesTodayRes.data as any[]).reduce(
        (s: number, e: any) => s + e.amount,
        0,
      );

      const today = new Date();
      const todaysSales = invoices
        .filter((inv) => {
          const d = new Date(inv.dateCreated);
          return (
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate() &&
            inv.status !== 'VOID'
          );
        })
        .reduce((sum, inv) => sum + inv.totalAmount, 0);

      return {
        totalProducts: products.length,
        totalSalesToday: todaysSales,
        expensesToday,
        netToday: todaysSales - expensesToday,
        weeklySales: weekly.totalSales ?? 0,
        monthlyRevenue: monthly.totalSales ?? 0,
        expensesMonthly,
        netMonthly: (monthly.totalSales ?? 0) - expensesMonthly,
        lowStock: products.filter((p) => p.quantityInStock < (p.reorderPoint ?? 5)),
        recentInvoices: invoices.slice(0, 5),
      };
    },
  });
}
