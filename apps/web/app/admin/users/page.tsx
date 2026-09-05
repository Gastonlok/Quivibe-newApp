"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  MODERATION_PERMISSIONS,
  permissionLabels,
} from "@/features/admin/permissions";
import { adminRequest } from "@/features/admin/client";

type Account = {
  id: string;
  name: string;
  email: string;
  role: string;
  suspendedAt: string | null;
  moderationPermissions: string[];
};
export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<Account[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      void adminRequest(
        `/api/admin/users?q=${encodeURIComponent(query)}&page=${page}`,
      )
        .then((data) => {
          if (active) {
            setUsers(data.users);
            setTotal(data.total);
          }
        })
        .catch((e) => {
          if (active) setFeedback(e.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, page, version]);
  function edit(id: string, patch: Partial<Account>) {
    setUsers((all) =>
      all.map((user) => (user.id === id ? { ...user, ...patch } : user)),
    );
  }
  async function save(user: Account, remove = false) {
    if (
      remove &&
      !confirm(`Supprimer définitivement le compte de ${user.name} ?`)
    )
      return;
    setBusy(true);
    setFeedback("");
    try {
      await adminRequest(
        `/api/admin/users/${user.id}`,
        remove ? "DELETE" : "PATCH",
        remove
          ? undefined
          : {
              role: user.role,
              suspended: Boolean(user.suspendedAt),
              moderationPermissions: user.moderationPermissions,
            },
      );
      setFeedback(
        remove ? "Compte supprimé." : "Compte et permissions enregistrés.",
      );
      setVersion((n) => n + 1);
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Opération impossible.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main>
      <h1 className="text-3xl font-extrabold">Comptes et collaborateurs</h1>
      <p className="mt-2 text-gray-600">
        {total} comptes. Confiez des tâches précises sans donner le rôle
        administrateur.
      </p>
      <label className="mt-6 block">
        <span className="text-sm font-bold">Rechercher par nom ou e-mail</span>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          className="mt-2 w-full rounded-xl border p-3"
        />
      </label>
      {feedback && (
        <p role="status" className="my-4 rounded-xl border bg-white p-3">
          {feedback}
        </p>
      )}
      {loading ? (
        <p className="mt-6" role="status">
          Chargement…
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {users.map((user) => {
            const self = session?.user?.id === user.id;
            return (
              <article
                key={user.id}
                className="rounded-2xl border bg-white p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-bold">
                      {user.name}
                      {self ? " (vous)" : ""}
                    </h2>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <Link
                    href={`/admin/messages?userId=${encodeURIComponent(user.id)}`}
                    className="font-bold text-primary-700"
                  >
                    Envoyer un message
                  </Link>
                </div>
                <fieldset disabled={busy} className="mt-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <label>
                      Rôle{" "}
                      <select
                        aria-label={`Rôle de ${user.name}`}
                        disabled={self}
                        value={user.role}
                        onChange={(e) =>
                          edit(user.id, {
                            role: e.target.value,
                            moderationPermissions: [],
                          })
                        }
                        className="ml-2 rounded-lg border p-2"
                      >
                        <option value="USER">Utilisateur</option>
                        <option value="OWNER">Propriétaire</option>
                        <option value="ADMIN">Administrateur</option>
                      </select>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        disabled={self}
                        checked={Boolean(user.suspendedAt)}
                        onChange={(e) =>
                          edit(user.id, {
                            suspendedAt: e.target.checked
                              ? new Date().toISOString()
                              : null,
                          })
                        }
                      />
                      Compte suspendu
                    </label>
                  </div>
                  {user.role !== "ADMIN" ? (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {MODERATION_PERMISSIONS.map((permission) => (
                        <label
                          key={permission}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={user.moderationPermissions.includes(
                              permission,
                            )}
                            onChange={(e) =>
                              edit(user.id, {
                                moderationPermissions: e.target.checked
                                  ? [...user.moderationPermissions, permission]
                                  : user.moderationPermissions.filter(
                                      (p) => p !== permission,
                                    ),
                              })
                            }
                          />
                          {permissionLabels[permission]}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-primary-700">
                      Accès complet à l’administration.
                    </p>
                  )}
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={() => void save(user)}
                      className="rounded-xl bg-primary-600 px-4 py-2 font-bold text-white"
                    >
                      Enregistrer
                    </button>
                    {!self && (
                      <button
                        onClick={() => void save(user, true)}
                        className="rounded-xl border border-red-200 px-4 py-2 text-red-700"
                      >
                        Supprimer le compte
                      </button>
                    )}
                  </div>
                </fieldset>
              </article>
            );
          })}
          {!users.length && <p>Aucun compte trouvé.</p>}
        </div>
      )}
      <div className="mt-6 flex justify-between">
        <button
          disabled={page <= 1 || loading || busy}
          onClick={() => setPage(page - 1)}
        >
          Précédent
        </button>
        <span>Page {page}</span>
        <button
          disabled={page * 50 >= total || loading || busy}
          onClick={() => setPage(page + 1)}
        >
          Suivant
        </button>
      </div>
    </main>
  );
}
