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

// ============================================

// pages/api/admin/user-verification-status.js
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
    
    if (!user) {
      return res.status(200).json({ 
        exists: false,
        isVerified: false,
        email: email.toLowerCase() 
      });
    }

    return res.status(200).json({ 
      exists: true,
      isVerified: user.isVerified || false,
      email: user.email 
    });

  } catch (error) {
    console.error('خطأ في التحقق من حالة المستخدم الإداري:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

// ============================================

// pages/api/admin/verify-user.js
import clientPromise from "@/lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const client = await clientPromise;
    const db = client.db();
    
    // تحديث حالة التحقق في collection الإداريين
    const adminUsersCollection = db.collection("adminusers");
    const result = await adminUsersCollection.updateOne(
      { email: email.toLowerCase() },
      { $set: { isVerified: true } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    return res.status(200).json({ 
      success: true,
      message: 'Admin user verified successfully',
      email: email.toLowerCase() 
    });

  } catch (error) {
    console.error('خطأ في تحديث حالة التحقق للمستخدم الإداري:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}