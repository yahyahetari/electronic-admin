import { hash } from 'bcryptjs'
import clientPromise from "@/lib/mongodb"

const adminEmails = ['yahyahetari2002@gmail.com', 'yahyaalhetari5@gmail.com', 'Hazembohloly@gmail.com']

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, email, password } = req.body

  if (!adminEmails.includes(email)) {
    return res.status(403).json({ error: 'Email not authorized' })
  }

  try {
    const client = await clientPromise
    const db = client.db()

    const existingUser = await db.collection('adminusers').findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    const hashedPassword = await hash(password, 12)
    
    const result = await db.collection('adminusers').insertOne({
      name,
      email,
      password: hashedPassword,
      isVerified: false
    })

    res.status(201).json({ success: true, userId: result.insertedId })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Something went wrong' })
  }
}
