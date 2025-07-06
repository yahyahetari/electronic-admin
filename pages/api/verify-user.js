import clientPromise from "@/lib/mongodb";

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email } = req.body;

    try {
      const client = await clientPromise;
      const usersCollection = client.db().collection("adminusers");
      
      await usersCollection.updateOne(
        { email: email },
        { $set: { isVerified: true } }
      );

      res.status(200).json({ message: 'User verified successfully' });
    } catch (error) {
      console.error('Failed to verify user:', error);
      res.status(500).json({ error: 'Failed to verify user' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
