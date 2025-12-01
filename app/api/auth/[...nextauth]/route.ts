import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import bcrypt from "bcryptjs";

// Force dynamic rendering - API routes cannot be statically exported
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Initialize Convex client for server-side use
const getConvexClient = () => {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  }
  return new ConvexHttpClient(url);
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔐 Login attempt for:", credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials");
          return null;
        }

        try {
          const convex = getConvexClient();
          
          // Get user from Convex
          console.log("📡 Querying Convex for user:", credentials.email);
          const user = await convex.query(api.queries.auth.getUserByEmail, {
            email: credentials.email,
          });
          
          console.log("👤 User found:", user ? "Yes" : "No");
          console.log("User details:", user ? {
            id: user._id,
            email: user.email,
            isActive: user.isActive,
            hasPassword: !!user.passwordHash
          } : null);

          if (!user) {
            console.log("❌ User not found");
            return null;
          }

          if (!user.isActive) {
            console.log("❌ User is not active");
            return null;
          }

          if (!user.passwordHash) {
            console.log("❌ User has no password hash");
            return null;
          }

          // Verify password (bcrypt works fine in Node.js/NextAuth)
          console.log("🔒 Verifying password...");
          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          
          if (!isValid) {
            console.log("❌ Invalid password");
            return null;
          }

          console.log("✅ Password verified successfully");

          // Update last login (don't fail if this errors)
          try {
            await convex.mutation(api.mutations.auth.updateLastLogin, {
              userId: user._id,
            });
          } catch (updateError) {
            console.warn("⚠️ Failed to update last login:", updateError);
            // Don't fail auth if this fails
          }

          console.log("✅ Login successful for:", user.email);
          return {
            id: user._id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error("❌ Auth error:", error);
          console.error("Error details:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
          });
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
   
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || (() => {
    console.error("⚠️ NEXTAUTH_SECRET is not set! Authentication will not work properly.");
    return "temp-secret-change-in-production";
  })(),
};

const handler = NextAuth(authOptions);

export { handler as GET, authOptions as auth, handler as POST };



