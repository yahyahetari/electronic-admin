import { mongooseConnect } from "@/lib/mongoose";
import { Order } from "@/models/Order";
import { Product } from "@/models/Products";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    await mongooseConnect();

    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ error: 'Order ID is required' });
        }

        // Find the order
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Check if order is already cancelled
        if (order.status === 'cancelled') {
            return res.status(400).json({ error: 'Order is already cancelled' });
        }

        // Check if order is already delivered
        if (order.status === 'delivered') {
            return res.status(400).json({ error: 'Cannot cancel delivered orders' });
        }

        console.log(`Starting cancellation for order: ${orderId}`);

        // Return items to inventory
        for (const item of order.items) {
            const product = await Product.findById(item.productId);
            
            if (!product) {
                console.log(`❌ Product ${item.productId} not found`);
                continue;
            }

            console.log(`Processing product: ${product.title}`);
            console.log(`Item properties:`, item.properties);

            // إذا كان المنتج يحتوي على متغيرات
            if (product.variants && product.variants.length > 0) {
                console.log(`Product has ${product.variants.length} variants`);
                
                let variantFound = false;
                for (let variant of product.variants) {
                    // تطبيع الخصائص للمقارنة
                    const variantPropsNormalized = {};
                    const itemPropsNormalized = {};
                    
                    // تطبيع خصائص المتغير
                    Object.keys(variant.properties || {}).forEach(key => {
                        variantPropsNormalized[key.trim()] = String(variant.properties[key]).trim();
                    });
                    
                    // تطبيع خصائص العنصر
                    Object.keys(item.properties || {}).forEach(key => {
                        itemPropsNormalized[key.trim()] = String(item.properties[key]).trim();
                    });

                    console.log('Comparing variant:', variantPropsNormalized);
                    console.log('With item:', itemPropsNormalized);

                    // مقارنة الخصائص
                    const keysMatch = Object.keys(itemPropsNormalized).every(key => 
                        variantPropsNormalized[key] === itemPropsNormalized[key]
                    ) && Object.keys(itemPropsNormalized).length === Object.keys(variantPropsNormalized).length;

                    if (keysMatch) {
                        console.log(`✅ Variant matched! Current stock: ${variant.stock}`);
                        variant.stock += item.quantity;
                        variantFound = true;
                        console.log(`✅ Returned ${item.quantity} units. New stock: ${variant.stock}`);
                        break;
                    }
                }

                if (!variantFound) {
                    console.error(`❌ No matching variant found for properties:`, item.properties);
                }
            } else {
                // إذا لم يكن لديه متغيرات، تحديث المخزون الرئيسي
                console.log(`Product has no variants. Current stock: ${product.stock}`);
                product.stock += item.quantity;
                console.log(`✅ Returned ${item.quantity} units. New stock: ${product.stock}`);
            }

            await product.save();
            console.log(`✅ Product saved: ${product.title}`);
        }

        // Update order status to cancelled
        order.status = 'cancelled';
        await order.save();

        console.log(`✅ Order ${orderId} cancelled successfully`);

        return res.status(200).json({ 
            success: true, 
            message: 'Order cancelled successfully and items returned to inventory',
            order 
        });

    } catch (error) {
        console.error('❌ Error cancelling order:', error);
        console.error('Error stack:', error.stack);
        return res.status(500).json({ error: 'Failed to cancel order', details: error.message });
    }
}