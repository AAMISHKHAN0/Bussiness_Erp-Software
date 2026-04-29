import { Pool } from "pg";

/**
 * Handle database queries for Business Intelligence and Reporting - Repository Layer
 */
export class ReportRepository {
    /**
     * Get dashboard sales/purchase trends for the last N months
     */
    static async getDashboardTimeSeries(db: Pool, months = 6) {
        const query = `
      WITH month_series AS (
        SELECT generate_series(
          date_trunc('month', CURRENT_DATE) - (($1::int - 1) * interval '1 month'),
          date_trunc('month', CURRENT_DATE),
          interval '1 month'
        )::date AS month_start
      ),
      sales AS (
        SELECT
          date_trunc('month', order_date)::date AS month_start,
          SUM(total_amount)::numeric(12, 2) AS revenue,
          COUNT(*)::int AS sales_count
        FROM sales_orders
        WHERE COALESCE(status, '') IN ('Completed', 'Delivered')
        GROUP BY 1
      ),
      purchases AS (
        SELECT
          date_trunc('month', order_date)::date AS month_start,
          SUM(total_amount)::numeric(12, 2) AS expenses,
          COUNT(*)::int AS purchase_count
        FROM purchase_orders
        WHERE COALESCE(status, '') IN ('Completed', 'Received')
        GROUP BY 1
      )
      SELECT
        ms.month_start,
        COALESCE(s.revenue, 0)::float8 AS revenue,
        COALESCE(s.sales_count, 0)::int AS sales_count,
        COALESCE(p.expenses, 0)::float8 AS expenses,
        COALESCE(p.purchase_count, 0)::int AS purchase_count
      FROM month_series ms
      LEFT JOIN sales s ON s.month_start = ms.month_start
      LEFT JOIN purchases p ON p.month_start = ms.month_start
      ORDER BY ms.month_start ASC
    `;

        const result = await db.query(query, [months]);
        return result.rows;
    }

    /**
     * Get sales summary/trends
     */
    static async getSalesTrends(db: Pool, month?: string) {
        let sql = 'SELECT * FROM sales_trends';
        const params = [];
        if (month) {
            sql += ' WHERE month = $1';
            params.push(month);
        }
        const result = await db.query(sql, params);
        return result.rows;
    }

    /**
     * Get inventory summary
     */
    static async getInventorySummary(db: Pool, category?: string) {
        let sql = 'SELECT * FROM inventory_summaries';
        const params = [];
        if (category) {
            sql += ' WHERE category = $1';
            params.push(category);
        }
        const result = await db.query(sql, params);
        return result.rows;
    }

    /**
     * Get HR headcount and payroll summary by department
     */
    static async getHRHeadcount(db: Pool) {
        const query = `
      SELECT department, COUNT(*) as count, SUM(salary) as total_salary 
      FROM employees 
      GROUP BY department
    `;
        const result = await db.query(query);
        return result.rows;
    }

    /**
     * Get key performance indicators for dashboard
     */
    static async getDashboardKPIs(db: Pool) {
        const revenueRes = await db.query("SELECT SUM(total_amount) as total FROM sales_orders WHERE status = 'Completed'");
        const salesRes = await db.query('SELECT COUNT(*) as count FROM sales_orders');
        const productRes = await db.query('SELECT COUNT(*) as count FROM products');
        const employeeRes = await db.query('SELECT COUNT(*) as count FROM employees');
        const lowStockRes = await db.query(`
      SELECT p.name, i.quantity, p.min_stock_level 
      FROM inventory i 
      JOIN products p ON i.product_id = p.id 
      WHERE i.quantity <= p.min_stock_level 
      ORDER BY i.quantity ASC 
      LIMIT 5
    `);

        return {
            totalRevenue: parseFloat(revenueRes.rows[0].total || 0),
            totalSales: parseInt(salesRes.rows[0].count || 0),
            totalProducts: parseInt(productRes.rows[0].count || 0),
            totalEmployees: parseInt(employeeRes.rows[0].count || 0),
            lowStockItems: lowStockRes.rows
        };
    }
}
