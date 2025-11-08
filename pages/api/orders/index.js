// pages/api/orders/index.js
import { mongooseConnect } from "@/lib/mongoose";
import mongoose from "mongoose";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await mongooseConnect();
        
        // استخدام MongoDB مباشرة لضمان الحصول على جميع الحقول
        const db = mongoose.connection.db;
        const ordersCollection = db.collection('orders');
        
        const orders = await ordersCollection
            .find({})
            .sort({ createdAt: -1 })
            .toArray();
        
        console.log(`Fetched ${orders.length} orders`);
        
        // طباعة عينة للتشخيص
        if (orders.length > 0) {
            console.log('First order sample:', {
                id: orders[0]._id,
                paid: orders[0].paid,
                status: orders[0].status,
                viewed: orders[0].viewed
            });
        }
        
        // تحويل ObjectId إلى string
        const ordersData = orders.map(order => ({
            ...order,
            _id: order._id.toString()
        }));
        
        return res.status(200).json(ordersData);

    } catch (error) {
        console.error('Error fetching orders:', error);
        return res.status(500).json({ 
            error: 'Failed to fetch orders', 
            details: error.message 
        });
    }
}