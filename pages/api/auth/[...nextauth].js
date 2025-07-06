import NextAuth from 'next-auth'
import CredentialsProvider from "next-auth/providers/credentials"
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import clientPromise from "@/lib/mongodb"
import { compare } from 'bcryptjs'

const adminEmails = ['yahyahetari2002@gmail.com', 'yahyaalhetari5@gmail.com', 'Hazembohloly@gmail.com'];

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Check if email is in adminEmails list
        if (!adminEmails.includes(credentials.email)) {
          return null;
        }

        const client = await clientPromise;
        const usersCollection = client.db().collection("adminusers");
        
        const user = await usersCollection.findOne({ email: credentials.email });
        
        if (user && await compare(credentials.password, user.password)) {
          return { 
            id: user._id.toString(), 
            name: user.name, 
            email: user.email, 
            isVerified: user.isVerified,
            isAdmin: true 
          };
        }
        return null;
      }
    })
  ],
  adapter: MongoDBAdapter(clientPromise, {
    collections: {
      Users: "users",
    }
  }),
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isVerified = user.isVerified;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.isVerified = token.isVerified;
      session.user.isAdmin = token.isAdmin;
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);

export async function isAdminRequest(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email || !adminEmails.includes(session.user.email)) {
    throw new Error('Not authorized as admin');
  }
}
