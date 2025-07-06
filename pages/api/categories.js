import { Category } from "@/models/Category";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { mongooseConnect } from "@/lib/mongoose";

export default async function handle(req, res) {
    const { method } = req;

    try {
        await mongooseConnect();

        // Check admin session
        const session = await getServerSession(req, res, authOptions);
        if (!session?.user?.email) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        // Handle GET request
        if (method === 'GET') {
            const categories = await Category.find().populate('parent');
            return res.json(categories);
        }

        // Handle POST request
        if (method === 'POST') {
            const { name, parentCategory, properties, tags, image } = req.body;
            const categoryDoc = await Category.create({
                name,
                parent: parentCategory || null,
                properties,
                tags,
                image
            });
            return res.json(categoryDoc);
        }

        // Handle PUT request
        if (method === 'PUT') {
            const { name, parentCategory, properties, tags, _id, image } = req.body;

            // Find the category first to trigger the pre-validate hook
            const category = await Category.findById(_id);
            if (category) {
                category.name = name;
                category.parent = parentCategory || null;
                category.properties = properties;
                category.tags = tags;
                category.image = image;

                // Save to trigger the slug update
                await category.save();
                return res.json(category);
            }
            return res.status(404).json({ error: 'Category not found' });
        }


        // Handle DELETE request
        if (method === 'DELETE') {
            const { id } = req.query;
            await Category.deleteOne({ _id: id });
            return res.json(true);
        }

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
