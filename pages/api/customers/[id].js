import { mongooseConnect } from "@/lib/mongoose";
import { Order } from "@/models/Order";

export default async function handler(req, res) {
    const { id } = req.query;
    await mongooseConnect();

    try {
        const customer = await Order.aggregate([
            {
                $match: { email: id }
            },
            {
                $group: {
                    _id: "$email",
                    firstName: { $first: "$firstName" },
                    lastName: { $first: "$lastName" },
                    email: { $first: "$email" },
                    phone: { $first: "$phone" },
                    address: { $first: "$address" },
                    city: { $first: "$city" },
                    country: { $first: "$country" },
                    orderCount: { $sum: 1 },
                    totalSpent: { $sum: "$totalAmount" }
                }
            }
        ]);

        if (!customer || customer.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json(customer[0]);
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
