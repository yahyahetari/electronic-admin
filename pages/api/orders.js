import { mongooseConnect } from "@/lib/mongoose";
import { Order } from "@/models/Order";

export default async function handler(req, res) {
    await mongooseConnect();
    try {
        const orders = await Order.find()
            .select('_id firstName lastName email phone items createdAt totalAmount viewed status paid shippingCost')
            .sort({createdAt: -1});
        
        if (orders.length > 0) {
           
        }
        
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'حدث خطأ في النظام' });
    }
}