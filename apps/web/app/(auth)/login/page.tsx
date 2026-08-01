import Link from "next/link";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-col items-center gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Se connecter</h1>
        <p className="text-sm text-gray-600 mt-1">
          Content de te revoir sur Quivibe.
        </p>
      </div>

      <LoginForm />

      <p className="text-sm text-gray-600">
        Pas encore de compte ?{" "}
        <Link href="/register" className="underline">
          Créer un compte
        </Link>
      </p>
    </main>
  );
}
