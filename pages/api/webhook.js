// pages/api/webhook.js
import { mongooseConnect } from "@/lib/mongoose";
import { Order } from "@/models/Order";
import { Product } from "@/models/Products";
import { buffer } from "micro";
import { sendOrderNotifications } from "@/lib/whatsapp-waha";

const stripe = require('stripe')(process.env.STRIPE_SK);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const SHIPPING_COST = 2000;

export default async function handler(req, res) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 WEBHOOK RECEIVED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const sig = req.headers['stripe-signature'];
    const buf = await buffer(req);

    let event;
    try {
        event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
        console.log('✅ Stripe webhook verified:', event.type);
    } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return res.status(400).json({ message: `Webhook Error: ${err.message}` });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const metadata = session.metadata;
        const paid = session.payment_status === 'paid';

        console.log('💳 Payment status:', paid ? 'PAID ✅' : 'UNPAID ❌');

        if (paid) {
            try {
                // ⭐ الاتصال بقاعدة البيانات أولاً!
                await mongooseConnect();
                console.log('✅ Database connected');

                // إعادة بناء بيانات الطلب من metadata
                const orderIds = metadata.orderIds.split(',');
                const quantities = metadata.quantities.split(',').map(Number);
                const prices = metadata.prices.split(',').map(Number);
                const properties = JSON.parse(metadata.properties || '[]');
                
                // تقسيم الاسم بشكل آمن
                const nameParts = metadata.customerName.split(' ');
                const firstName = nameParts[0] || 'N/A';
                const lastName = nameParts.slice(1).join(' ') || 'N/A';
                
                const [email, phone] = metadata.contactInfo.split('|');
                const [address, city, country, postalCode] = metadata.shippingAddress.split('|');
                const address2 = metadata.address2 || '';
                const state = metadata.state || '';

                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('📦 ORDER DATA:');
                console.log('Customer:', firstName, lastName);
                console.log('Phone:', phone);
                console.log('Country:', country);
                console.log('Email:', email);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                // جلب تفاصيل المنتجات
                const products = await Product.find({ _id: { $in: orderIds } });
                console.log(`✅ Found ${products.length} products`);

                const orderItems = orderIds.map((id, index) => {
                    const product = products.find(p => p._id.toString() === id);
                    if (!product) {
                        console.error(`❌ Product not found: ${id}`);
                        return null;
                    }
                    return {
                        productId: id,
                        title: product.title,
                        quantity: quantities[index],
                        price: prices[index],
                        properties: properties[index] || {},
                        image: product.images?.[0] || ''
                    };
                }).filter(Boolean);

                const totalAmount = orderItems.reduce((sum, item) => 
                    sum + (item.price * item.quantity), 0) + SHIPPING_COST / 100;

                console.log('💰 Total Amount:', totalAmount, 'SAR');

                // إنشاء الطلب
                const orderDoc = await Order.create({
                    items: orderItems,
                    totalAmount,
                    firstName,
                    lastName,
                    email,
                    phone,
                    address,
                    address2,
                    state,
                    city,
                    country,
                    postalCode,
                    notes: metadata.additionalInfo || '',
                    shippingCost: SHIPPING_COST / 100,
                    paid: true,
                    paymentId: session.payment_intent,
                    status: 'pending',
                    viewed: false
                });

                console.log('✅ Order created:', orderDoc._id.toString());

                // ⭐ إرسال إشعارات WhatsApp
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('📱 STARTING WHATSAPP NOTIFICATIONS...');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                
                try {
                    const notificationResults = await sendOrderNotifications(orderDoc);
                    
                    console.log('📊 Notification Results:');
                    console.log('Customer:', notificationResults.customer);
                    console.log('Admins:', notificationResults.admins);
                    
                    // تحليل النتائج
                    if (notificationResults.customer?.success) {
                        console.log('✅ Customer notification: SUCCESS');
                    } else {
                        console.error('❌ Customer notification: FAILED');
                        console.error('   Error:', notificationResults.customer?.error);
                    }
                    
                    if (notificationResults.admins && notificationResults.admins.length > 0) {
                        const successCount = notificationResults.admins.filter(a => a.success).length;
                        console.log(`📈 Admin notifications: ${successCount}/${notificationResults.admins.length} sent`);
                        
                        notificationResults.admins.forEach((admin, index) => {
                            if (admin.success) {
                                console.log(`  ✅ Admin ${index + 1} (${admin.phone}): SUCCESS`);
                            } else {
                                console.error(`  ❌ Admin ${index + 1} (${admin.phone}): FAILED`);
                                console.error(`     Error: ${admin.error}`);
                            }
                        });
                    } else {
                        console.warn('⚠️ No admin notifications sent');
                    }
                    
                } catch (notifError) {
                    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.error('❌ NOTIFICATION ERROR:');
                    console.error('Message:', notifError.message);
                    console.error('Stack:', notifError.stack);
                    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                }

                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('📦 UPDATING INVENTORY...');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                // تحديث مخزون المنتجات
                for (let i = 0; i < orderIds.length; i++) {
                    const product = products.find(p => p._id.toString() === orderIds[i]);
                    if (product) {
                        if (product.variants && product.variants.length > 0) {
                            const variantProps = properties[i] || {};
                            const variant = product.variants.find(v => 
                                Object.keys(variantProps).every(
                                    key => v.properties[key] === variantProps[key]
                                )
                            );
                            if (variant) {
                                variant.stock -= quantities[i];
                                console.log(`  ✅ Variant stock updated: ${product.title}`);
                            }
                        } else {
                            product.stock -= quantities[i];
                            console.log(`  ✅ Product stock updated: ${product.title}`);
                        }
                        await product.save();
                    }
                }

                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('✅ ORDER PROCESSING COMPLETE!');
                console.log('Order ID:', orderDoc._id.toString());
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                return res.json({ 
                    received: true, 
                    orderId: orderDoc._id.toString(),
                    success: true
                });

            } catch (err) {
                console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.error('❌ ORDER PROCESSING ERROR:');
                console.error('Message:', err.message);
                console.error('Stack:', err.stack);
                console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                
                return res.status(500).json({ 
                    message: 'Error processing order', 
                    error: err.message,
                    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
                });
            }
        } else {
            console.log('⚠️ Payment not completed, skipping order creation');
        }
    }

    res.json({ received: true });
}

export const config = {
    api: {
        bodyParser: false,
    },
};