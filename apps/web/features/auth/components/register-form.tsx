"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/features/auth/schema";
import { registerAction, loginAction } from "@/features/auth/actions";

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterInput) => {
    setServerError(null);

    const result = await registerAction(values);
    if (!result.success) {
      setServerError(result.error);
      return;
    }

    const loginResult = await loginAction({
      email: values.email,
      password: values.password,
    });

    if (!loginResult.success) {
      setServerError(
        "Compte créé, mais la connexion automatique a échoué. Essaie de te connecter."
      );
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 w-full max-w-sm"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Nom
        </label>
        <input
          id="name"
          type="text"
          className="border rounded-md px-3 py-2"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="border rounded-md px-3 py-2"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          className="border rounded-md px-3 py-2"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-black text-white rounded-md px-4 py-2 disabled:opacity-50"
      >
        {isSubmitting ? "Création du compte..." : "Créer mon compte"}
      </button>
    </form>
  );
}
