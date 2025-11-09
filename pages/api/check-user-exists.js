// pages/api/admin/check-user-exists.js
import clientPromise from "@/lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const client = await clientPromise;
    const db = client.db();
    
    // البحث في collection الإداريين
    const adminUsersCollection = db.collection("adminusers");
    const user = await adminUsersCollection.findOne({ email: email.toLowerCase() });
    
    return res.status(200).json({ 
      exists: !!user,
      email: email.toLowerCase() 
    });

  } catch (error) {
    console.error('خطأ في التحقق من وجود المستخدم الإداري:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
