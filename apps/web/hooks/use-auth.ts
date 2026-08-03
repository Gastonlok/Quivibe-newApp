// apps/web/hooks/use-auth.ts
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const user = session?.user;
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  const isAdmin = user?.role === "ADMIN";
  const isOwner = user?.role === "OWNER";
  const isUser = user?.role === "USER";

  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    isOwner,
    isUser,
    session,
  };
}

export function useRequireAuth(redirectTo = "/login") {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return { isAuthenticated, isLoading };
}

export function useRequireRole(role: "ADMIN" | "OWNER", redirectTo = "/") {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role !== role && user?.role !== "ADMIN") {
        router.push(redirectTo);
      }
    }
  }, [isAuthenticated, isLoading, user, router, redirectTo, role]);
}
