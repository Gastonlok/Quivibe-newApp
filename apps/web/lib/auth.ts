// apps/web/lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { CredentialsSignin } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/features/auth/schema";

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
      moderationPermissions?: string[];
      image?: string | null;
    };
  }
}

class EmailNotVerifiedError extends CredentialsSignin {
  code = "email-not-verified";
}

class AuthServiceUnavailableError extends CredentialsSignin {
  code = "auth-service-unavailable";
}

export const {
  handlers,
  signIn,
  signOut,
  auth: sessionAuth,
} = NextAuth({
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
            where: { email },
          });

          if (!user || !user.passwordHash || user.suspendedAt) {
            return null;
          }

          if (user.role === "USER" && !user.emailVerified) {
            throw new EmailNotVerifiedError();
          }

          // Vérification du mot de passe
          const passwordValid = await bcrypt.compare(
            password,
            user.passwordHash,
          );
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
          if (error instanceof EmailNotVerifiedError) {
            throw error;
          }

          console.error("Erreur d'authentification:", error);
          throw new AuthServiceUnavailableError();
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
        const currentUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
            suspendedAt: true,
            moderationPermissions: true,
          },
        });

        if (currentUser && !currentUser.suspendedAt) {
          session.user.id = currentUser.id;
          session.user.name = currentUser.name;
          session.user.email = currentUser.email;
          session.user.role = currentUser.role;
          session.user.image = currentUser.image;
          session.user.moderationPermissions =
            currentUser.moderationPermissions;
        } else {
          session.user.id = "";
          session.user.role = "DISABLED";
          session.user.moderationPermissions = [];
        }
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
});

// Deleted or suspended accounts lose access on their next server request.
export async function auth() {
  const session = await sessionAuth();
  return session?.user?.id && session.user.role !== "DISABLED" ? session : null;
}
