// pages/api/orders/updateStatus.js
import { mongooseConnect } from "@/lib/mongoose";
import { Order } from "@/models/Order";
import mongoose from "mongoose";

export default async function handler(req, res) {
    console.log('=== updateStatus API called ===');
    console.log('Method:', req.method);
    console.log('Body:', req.body);

    if (req.method !== 'POST') {
        console.log('Method not allowed');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // الاتصال بقاعدة البيانات
        console.log('Connecting to MongoDB...');
        await mongooseConnect();
        console.log('MongoDB connected successfully');
        
        const { orderId, status } = req.body;

        console.log('Received data:', { orderId, status });

        // التحقق من البيانات المطلوبة
        if (!orderId || !status) {
            console.log('Missing required fields');
            return res.status(400).json({ error: 'Order ID and status are required' });
        }

        // التحقق من صحة الحالة
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            console.log('Invalid status:', status);
            return res.status(400).json({ error: 'Invalid status value' });
        }

        // التحقق من صحة ObjectId
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            console.log('Invalid ObjectId format:', orderId);
            return res.status(400).json({ error: 'Invalid Order ID format' });
        }

        console.log('Finding order with ID:', orderId);
        
        // البحث عن الطلب أولاً
        const existingOrder = await Order.findById(orderId);
        
        if (!existingOrder) {
            console.log('Order not found');
            return res.status(404).json({ error: 'Order not found' });
        }

        console.log('Order found. Current status:', existingOrder.status);

        // منع تغيير حالة الطلبات الملغاة
        if (existingOrder.status === 'cancelled' && status !== 'cancelled') {
            console.log('Cannot change status of cancelled order');
            return res.status(400).json({ error: 'Cannot change status of cancelled orders' });
        }

        // تحديث الحالة
        console.log('Updating status to:', status);
        existingOrder.status = status;
        existingOrder.updatedAt = new Date();
        
        const savedOrder = await existingOrder.save();
        console.log('Order saved successfully. New status:', savedOrder.status);

        // التحقق من أن التحديث تم بنجاح
        const verifyOrder = await Order.findById(orderId);
        console.log('Verification - Status in DB:', verifyOrder.status);

        return res.status(200).json({ 
            success: true, 
            message: 'Order status updated successfully',
            order: savedOrder,
            verified: verifyOrder.status === status
        });

    } catch (error) {
        console.error('=== Error in updateStatus API ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        return res.status(500).json({ 
            error: 'Failed to update order status', 
            details: error.message 
        });
    }
}