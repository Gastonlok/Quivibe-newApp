import Link from "next/link";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/features/auth/components/logout-button";

export async function Navbar() {
  const session = await auth();

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b">
      <Link href="/" className="font-semibold text-lg">
        Quivibe
      </Link>

      <nav className="flex items-center gap-4 text-sm">
        {session?.user ? (
          <>
            <Link href="/favoris" className="underline">
              Favoris
            </Link>
            <span className="text-gray-600">
              Bonjour, {session.user.name}
            </span>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link href="/login" className="underline">
              Se connecter
            </Link>
            <Link href="/register" className="underline">
              Créer un compte
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
