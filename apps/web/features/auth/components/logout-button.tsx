"use client";

import { useRouter } from "next/navigation";
import { logoutAction } from "@/features/auth/actions";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAction();
    router.push("/");
    router.refresh();
  };

  return (
    <button onClick={handleLogout} className="underline">
      Se déconnecter
    </button>
  );
}
