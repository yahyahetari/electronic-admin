// pages/api/orders/updateStatus.js
import { mongooseConnect } from "@/lib/mongoose";
import { Order } from "@/models/Order";
import { sendOrderStatusUpdate } from "@/lib/whatsapp-waha";
import mongoose from "mongoose";

export default async function handler(req, res) {
    console.log('=== updateStatus API called ===');
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await mongooseConnect();
        
        const { orderId, status } = req.body;

        if (!orderId || !status) {
            return res.status(400).json({ error: 'Order ID and status are required' });
        }

        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ error: 'Invalid Order ID format' });
        }

        const existingOrder = await Order.findById(orderId);
        
        if (!existingOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // منع تغيير حالة الطلبات الملغاة
        if (existingOrder.status === 'cancelled' && status !== 'cancelled') {
            return res.status(400).json({ error: 'Cannot change status of cancelled orders' });
        }

        // حفظ الحالة القديمة
        const oldStatus = existingOrder.status;

        // تحديث الحالة
        existingOrder.status = status;
        existingOrder.updatedAt = new Date();
        
        const savedOrder = await existingOrder.save();
        console.log('✓ Order status updated:', oldStatus, '→', status);

        // إرسال إشعار واتساب فقط إذا تغيرت الحالة فعلياً
        if (oldStatus !== status) {
            console.log('📱 Sending status update notification...');
            try {
                const result = await sendOrderStatusUpdate(savedOrder, status);
                if (result.success) {
                    console.log('✓ Status update notification sent');
                } else {
                    console.log('⚠️ Failed to send notification:', result.error);
                }
            } catch (notifError) {
                console.error('⚠️ Notification error (non-critical):', notifError.message);
            }
        } else {
            console.log('ℹ️ Status unchanged, skipping notification');
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Order status updated successfully',
            order: savedOrder,
            notificationSent: oldStatus !== status
        });

    } catch (error) {
        console.error('=== Error in updateStatus API ===');
        console.error('Error:', error.message);
        
        return res.status(500).json({ 
            error: 'Failed to update order status', 
            details: error.message 
        });
    }
}