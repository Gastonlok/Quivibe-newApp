"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { useRouter } from "next/navigation";

export function ReviewReportButton({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "reporting" | "done" | "error">("idle");

  async function report() {
    const reason = window.prompt("Pourquoi signalez-vous cet avis ?");
    if (!reason) return;
    setState("reporting");
    const response = await fetch(`/api/reviews/${reviewId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (response.status === 401) {
      router.push("/login");
      return;
    }
    setState(response.ok ? "done" : "error");
  }

  if (state === "done") return <span className="text-xs font-semibold text-gray-500">Signalement envoyé</span>;
  return <button type="button" onClick={report} disabled={state === "reporting"} className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-red-600 disabled:opacity-50"><Flag className="h-3.5 w-3.5" />{state === "error" ? "Réessayer" : "Signaler"}</button>;
}
