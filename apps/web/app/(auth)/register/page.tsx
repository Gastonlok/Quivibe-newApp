import Link from "next/link";
import { RegisterForm } from "@/features/auth/components/register-form";

export default function RegisterPage() {
  return (
    <main className="flex flex-col items-center gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Créer un compte</h1>
        <p className="text-sm text-gray-600 mt-1">
          Rejoins Quivibe pour découvrir où sortir à Kinshasa.
        </p>
      </div>

      <RegisterForm />

      <p className="text-sm text-gray-600">
        Déjà un compte ?{" "}
        <Link href="/login" className="underline">
          Se connecter
        </Link>
      </p>
    </main>
  );
}
