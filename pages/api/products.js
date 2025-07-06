import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Products";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";

export default async function handle(req, res) {
    const { method } = req;
    await mongooseConnect();
    
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
        return res.status(401).json({ error: "غير مصرح" });
    }

    if (method === 'GET') {
        if (req.query?.id) {
            res.json(await Product.findById(req.query.id));
        } else {
            res.json(await Product.find());
        }
    }

    if (method === 'POST') {
        const { title, description, variants, images, category, properties, tags } = req.body;
        // تحويل قيم المخزون إلى أرقام
        const processedVariants = variants.map(variant => ({
            ...variant,
            stock: Number(variant.stock)
        }));
    
        const productDoc = await Product.create({
            title, 
            description, 
            variants: processedVariants,
            images,
            category: category || null,
            properties, 
            tags,
        });
        res.json(productDoc);
    }
    
    if (method === 'PUT') {
        const { title, description, variants, images, category, properties, tags, _id } = req.body;
        // تحويل قيم المخزون إلى أرقام
        const processedVariants = variants.map(variant => ({
            ...variant,
            stock: Number(variant.stock)
        }));
    
        await Product.updateOne({ _id }, {
            title, 
            description, 
            variants: processedVariants,
            images,
            category: category || null,
            properties, 
            tags,
        });
        res.json(true);
    }
    

    if (method === 'DELETE') {
        if (req.query?.id) {
            await Product.deleteOne({_id: req.query.id});
            res.json(true);
        }
    }
}
