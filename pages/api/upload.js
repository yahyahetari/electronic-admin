import multiparty from "multiparty";
import fs from "fs";
import ImageKit from "imagekit";
import { mongooseConnect } from "@/lib/mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handle(req, res) {
    try {
        await mongooseConnect();
        
        // Check session
        const session = await getServerSession(req, res, authOptions);
        if (!session?.user?.email) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        const form = new multiparty.Form();
        const { files } = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                resolve({ fields, files });
            });
        });

        // Initialize ImageKit
        const imagekit = new ImageKit({
            publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
            urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
        });

        const Links = [];
        
        for (const file of files.file) {
            const ext = file.originalFilename.split('.').pop();
            const newFilename = `${Date.now()}.${ext}`;
            const fileContent = fs.readFileSync(file.path);

            // Upload to ImageKit
            const response = await imagekit.upload({
                file: fileContent,
                fileName: newFilename,
                folder: "/hetari-clothes" // اختياري: لتنظيم الصور في مجلد
            });

            Links.push(response.url);
        }

        return res.json({ Links });
    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({ error: error.message });
    }
}

export const config = {
    api: { bodyParser: false },
};