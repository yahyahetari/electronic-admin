import { getSession } from "next-auth/react";
import clientPromise from "@/lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    // حذف المستخدم من قاعدة البيانات
    await db.collection("users").deleteOne({ email: session.user.email });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user" });
  }
}
