import { mongooseConnect } from "@/lib/mongoose";
import { Order } from "@/models/Order";

export default async function handler(req, res) {
    await mongooseConnect();
    try {
        const orders = await Order.find()
            .select('_id firstName lastName items createdAt totalAmount viewed')
            .sort({createdAt: -1});
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'حدث خطأ في النظام' });
    }
}
