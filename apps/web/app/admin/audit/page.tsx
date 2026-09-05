import { prisma } from "@/lib/prisma";
import { getAdminActor } from "@/features/admin/access";
import { redirect } from "next/navigation";
export default async function AuditPage() {
  if (!(await getAdminActor("AUDIT"))) redirect("/");
  const logs = await prisma.adminAuditLog.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { name: true } } },
  });
  return (
    <main>
      <h1 className="text-3xl font-extrabold">Journal d’administration</h1>
      <p className="mt-2 text-gray-600">
        Les 100 dernières opérations enregistrées.
      </p>
      <div className="mt-6 space-y-3">
        {logs.map((log) => (
          <article key={log.id} className="rounded-xl border bg-white p-4">
            <p className="font-bold">{log.action}</p>
            <p className="text-sm text-gray-600">
              {log.actor?.name || "Compte supprimé"} ·{" "}
              {log.createdAt.toLocaleString("fr-FR")} · {log.targetId}
            </p>
          </article>
        ))}
        {!logs.length && <p>Aucune opération enregistrée.</p>}
      </div>
    </main>
  );
}
