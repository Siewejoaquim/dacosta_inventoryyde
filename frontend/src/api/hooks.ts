import { useQuery } from '@tanstack/react-query';
import api from './client';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const [productsRes, weeklyRes, monthlyRes, invoicesRes] = await Promise.all([
        api.get('/products'),
        api.get('/reports/weekly'),
        api.get('/reports/monthly'),
        api.get('/invoices'),
      ]);

      const products = productsRes.data as any[];
      const weekly = weeklyRes.data as any;
      const monthly = monthlyRes.data as any;
      const invoices = invoicesRes.data as any[];

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

      return {
        totalProducts: products.length,
        totalSalesToday: todaysSales,
        weeklySales: weekly.totalSales,
        monthlyRevenue: monthly.totalMonthlyRevenue,
        lowStock: products.filter((p) => p.quantityInStock < (p.reorderPoint ?? 5)),
        recentInvoices: invoices.slice(0, 5),
      };
    },
  });
}

