// pages/api/updateOrderView.js
import { mongooseConnect } from "@/lib/mongoose";
import { Order } from "@/models/Order";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            message: 'Only POST requests are accepted' 
        });
    }

    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ 
                success: false,
                error: 'Order ID is required' 
            });
        }

        await mongooseConnect();

        // تحديث الطلب كمقروء
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId, 
            { 
                viewed: true,
                viewedAt: new Date() // اختياري: لتسجيل وقت القراءة
            }, 
            { new: true }
        );

        if (!updatedOrder) {
            console.error(`Order not found: ${orderId}`);
            return res.status(404).json({ 
                success: false,
                error: 'Order not found' 
            });
        }

        console.log(`✓ Order ${orderId} marked as viewed`);

        return res.status(200).json({
            success: true,
            order: updatedOrder
        });

    } catch (error) {
        console.error('❌ Error updating order view status:', error);
        return res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            details: error.message 
        });
    }
}