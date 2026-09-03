"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2, Users } from "lucide-react";
import { invitePlaceCollaboratorAction, removePlaceCollaboratorAction } from "../actions";

type Collaborator = { id: string; role: string; user: { name: string; email: string } };

export function OwnerCollaborationPanel({ placeId, collaborators, canManage }: { placeId: string; collaborators: Collaborator[]; canManage: boolean }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"MANAGER" | "EDITOR">("EDITOR");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function invite() {
    startTransition(async () => {
      const result = await invitePlaceCollaboratorAction(placeId, email, role);
      setMessage(result.success ? "Collaborateur ajoute." : result.error);
      if (result.success) setEmail("");
    });
  }

  function remove(collaboratorId: string) {
    startTransition(async () => {
      const result = await removePlaceCollaboratorAction(placeId, collaboratorId);
      setMessage(result.success ? "Collaborateur retire." : result.error);
    });
  }

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5 text-primary-600" />
        <div><h2 className="font-extrabold text-gray-950">Equipe</h2><p className="text-sm text-gray-600">Deleguez la gestion de votre etablissement.</p></div>
      </div>
      <div className="mt-5 space-y-3">
        {collaborators.length === 0 ? <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">Aucun collaborateur pour le moment.</p> : collaborators.map((collaborator) => (
          <div key={collaborator.id} className="flex items-center justify-between gap-3 rounded-2xl bg-gray-50 p-4">
            <div><p className="font-bold text-gray-900">{collaborator.user.name}</p><p className="text-sm text-gray-500">{collaborator.user.email} · {collaborator.role === "MANAGER" ? "Responsable" : "Editeur"}</p></div>
            {canManage && <button type="button" onClick={() => remove(collaborator.id)} disabled={isPending} className="rounded-full p-2 text-red-700 hover:bg-red-50" aria-label="Retirer le collaborateur"><Trash2 className="h-4 w-4" /></button>}
          </div>
        ))}
      </div>
      {canManage && <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="email@exemple.com" className="rounded-xl border border-gray-300 px-3 py-2 text-sm" />
        <select value={role} onChange={(event) => setRole(event.target.value as "MANAGER" | "EDITOR")} className="rounded-xl border border-gray-300 px-3 py-2 text-sm"><option value="EDITOR">Editeur</option><option value="MANAGER">Responsable</option></select>
        <button type="button" onClick={invite} disabled={isPending || !email} className="rounded-xl bg-gray-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ajouter"}</button>
      </div>}
      {message && <p className="mt-3 text-sm font-semibold text-gray-600">{message}</p>}
    </section>
  );
}
