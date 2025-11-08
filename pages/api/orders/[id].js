// pages/api/orders/[id].js
import { mongooseConnect } from "@/lib/mongoose";
import { Order } from "@/models/Order";
import mongoose from "mongoose";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await mongooseConnect();
        
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ error: 'Order ID is required' });
        }

        // التحقق من صحة ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid Order ID format' });
        }

        const order = await Order.findById(id).lean();

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        console.log('Fetched order:', id, 'Status:', order.status, 'Paid:', order.paid);

        return res.status(200).json(order);

    } catch (error) {
        console.error('Error fetching order:', error);
        return res.status(500).json({ 
            error: 'Failed to fetch order', 
            details: error.message 
        });
    }
}