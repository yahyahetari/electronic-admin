import { mongooseConnect } from "@/lib/mongoose";
import { Order } from "@/models/Order";
import { Product } from "@/models/Products";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        await mongooseConnect();
        
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // جلب جميع الطلبات والمنتجات مرة واحدة
        const [orders, products] = await Promise.all([
            Order.find({}).sort({ createdAt: 1 }).lean(),
            Product.find({}).lean()
        ]);

        console.log("Orders:", orders);
        console.log("Products:", products);

        // إنشاء Map للمنتجات للوصول السريع
        const productsMap = new Map(products.map(p => [p._id.toString(), p]));

        const calculateOrderProfit = (order) => {
            let profit = 0;
            for (const item of order.items) {
                const product = productsMap.get(item.productId.toString());
                if (product) {
                    // تحقق من وجود item.properties
                    if (item.properties && typeof item.properties === 'object') {
                        const variant = product.variants.find(v => 
                            Object.entries(item.properties).every(([key, value]) => 
                                v.properties[key]?.includes(value)
                            )
                        );
                        if (variant) {
                            profit += (item.price - variant.cost) * item.quantity;
                        }
                    } else {
                        console.warn("Item properties are missing or invalid:", item);
                    }
                }
            }
            return profit;
        };

        const calculateMonthlyData = (orders) => {
            const monthlyData = {};
            
            orders.forEach(order => {
                const date = new Date(order.createdAt);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                
                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = {
                        revenue: 0,
                        profit: 0
                    };
                }
                
                monthlyData[monthKey].revenue += order.totalAmount;
                monthlyData[monthKey].profit += calculateOrderProfit(order);
            });
            
            return monthlyData;
        };

        const stats = {
            totalOrders: orders.length,
            totalRevenue: 0,
            thisMonthRevenue: 0,
            lastMonthRevenue: 0,
            uniqueCustomers: new Set(),
            totalProfit: 0,
            thisMonthProfit: 0,
            lastMonthProfit: 0
        };

        const monthlyData = calculateMonthlyData(orders);

        orders.forEach(order => {
            const orderDate = new Date(order.createdAt);
            const orderTotal = order.totalAmount;
            const orderProfit = calculateOrderProfit(order);

            stats.totalRevenue += orderTotal;
            stats.totalProfit += orderProfit;

            if (order.email) stats.uniqueCustomers.add(order.email);

            if (orderDate >= firstDayOfMonth) {
                stats.thisMonthRevenue += orderTotal;
                stats.thisMonthProfit += orderProfit;
            } else if (orderDate >= firstDayOfLastMonth && orderDate < firstDayOfMonth) {
                stats.lastMonthRevenue += orderTotal;
                stats.lastMonthProfit += orderProfit;
            }
        });

        const result = {
            totalOrders: stats.totalOrders,
            totalRevenue: parseFloat(stats.totalRevenue.toFixed(2)),
            thisMonthRevenue: parseFloat(stats.thisMonthRevenue.toFixed(2)),
            lastMonthRevenue: parseFloat(stats.lastMonthRevenue.toFixed(2)),
            uniqueCustomers: stats.uniqueCustomers.size,
            totalProfit: parseFloat(stats.totalProfit.toFixed(2)),
            thisMonthProfit: parseFloat(stats.thisMonthProfit.toFixed(2)),
            lastMonthProfit: parseFloat(stats.lastMonthProfit.toFixed(2)),
            monthlyRevenue: Object.fromEntries(
                Object.entries(monthlyData).map(([key, value]) => [key, value.revenue])
            ),
            monthlyProfit: Object.fromEntries(
                Object.entries(monthlyData).map(([key, value]) => [key, value.profit])
            )
        };

        console.log("Result:", result);

        res.json(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}