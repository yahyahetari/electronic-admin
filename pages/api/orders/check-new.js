// pages/api/orders/check-new.js
import { mongooseConnect } from "@/lib/mongoose";
import { Order } from "@/models/Order";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await mongooseConnect();
        
        // جلب الطلبات غير المقروءة فقط
        const unreadOrders = await Order.find({ viewed: false })
            .select('_id firstName lastName phone totalAmount createdAt status paid')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
        
        const unreadCount = unreadOrders.length;
        
        console.log(`📊 Unread orders: ${unreadCount}`);
        
        return res.status(200).json({
            success: true,
            count: unreadCount,
            orders: unreadOrders,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error checking new orders:', error);
        return res.status(500).json({ 
            success: false,
            error: 'Failed to check new orders', 
            details: error.message 
        });
    }
}