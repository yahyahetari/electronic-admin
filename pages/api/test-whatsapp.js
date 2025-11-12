// pages/api/test-whatsapp.js
import { mongooseConnect } from "@/lib/mongoose";
import { Order } from "@/models/Order";
import { sendOrderNotifications, sendWhatsAppMessage, checkWAHAStatus } from "@/lib/whatsapp-waha";

export default async function handler(req, res) {
    try {
        const { orderId, testMessage, phone, checkStatus } = req.query;

        // التحقق من حالة WAHA
        if (checkStatus === 'true') {
            const status = await checkWAHAStatus();
            return res.status(200).json({
                waha: status,
                config: {
                    url: process.env.WAHA_URL || 'Not configured',
                    session: process.env.WAHA_SESSION || 'default',
                    apiKeySet: !!process.env.WAHA_API_KEY,
                    adminPhone: process.env.ADMIN_PHONE || 'Not configured'
                }
            });
        }

        // اختبار بسيط لإرسال رسالة
        if (testMessage && phone) {
            console.log(`Testing simple message to: ${phone}`);
            const result = await sendWhatsAppMessage(phone, testMessage);
            return res.status(200).json({
                success: result.success,
                message: 'Test message sent',
                phone: phone,
                result: result
            });
        }

        // اختبار إشعار طلب كامل
        if (!orderId) {
            return res.status(400).json({ 
                error: 'Missing parameters',
                usage: {
                    checkStatus: 'GET /api/test-whatsapp?checkStatus=true',
                    testSimple: 'GET /api/test-whatsapp?phone=967777777777&testMessage=مرحبا',
                    testOrder: 'GET /api/test-whatsapp?orderId=YOUR_ORDER_ID'
                }
            });
        }

        await mongooseConnect();
        
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        console.log('Testing WhatsApp notifications for order:', order._id);
        
        const results = await sendOrderNotifications(order);

        return res.status(200).json({
            success: true,
            message: 'Notifications sent',
            orderId: order._id.toString(),
            customerPhone: order.phone,
            results: {
                customer: {
                    success: results.customer?.success || false,
                    error: results.customer?.error || null
                },
                admins: results.admins || []
            }
        });

    } catch (error) {
        console.error('Test error:', error);
        return res.status(500).json({
            error: 'Test failed',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}