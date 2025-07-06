import { mongooseConnect } from "@/lib/mongoose";
import { Order } from "@/models/Order";

export default async function handler(req, res) {
    await mongooseConnect();
    try {
        const customers = await Order.aggregate([
            {
                $group: {
                    _id: "$email",
                    firstName: { $first: "$firstName" },
                    lastName: { $first: "$lastName" },
                    email: { $first: "$email" },
                    orderCount: { $sum: 1 },
                    totalSpent: { $sum: "$totalAmount" }
                }
            },
            { $sort: { orderCount: -1 } }
        ]);

        res.json(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
