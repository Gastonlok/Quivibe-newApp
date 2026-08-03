// apps/web/lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/features/auth/schema";
import { PrismaAdapter } from "@auth/prisma-adapter";

// ✅ Déclaration des types pour les rôles
declare module "next-auth" {
  interface User {
    role?: string;
    id: string;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/auth/error",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(rawCredentials) {
        try {
          // Validation des credentials
          const parsed = loginSchema.safeParse(rawCredentials);
          if (!parsed.success) {
            console.error("Validation échouée:", parsed.error);
            return null;
          }

          const { email, password } = parsed.data;

          // Recherche de l'utilisateur
          const user = await prisma.user.findUnique({
            where: { email }
          });

          if (!user || !user.passwordHash) {
            return null;
          }

          // Vérification du mot de passe
          const passwordValid = await bcrypt.compare(password, user.passwordHash);
          if (!passwordValid) {
            return null;
          }

          // Retourner l'utilisateur avec son rôle
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error("Erreur d'authentification:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
});
