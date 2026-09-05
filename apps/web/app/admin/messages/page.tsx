"use client";
import { useEffect, useState } from "react";
import { adminRequest, processEmailQueue } from "@/features/admin/client";
type User = { id: string; name: string; email: string };
type Campaign = {
  id: string;
  subject: string;
  audience: string;
  createdAt: string;
  sendEmail: boolean;
  _count: { recipients: number };
};
type Delivery = { messageId: string; emailStatus: string; _count: number };
export default function AdminMessagesPage() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("SELECTED");
  const [userIds, setUserIds] = useState<string[]>([]);
  const [sendEmail, setSendEmail] = useState(true);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Campaign[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [configured, setConfigured] = useState(false);
  const [preview, setPreview] = useState<{
    count: number;
    emailCount: number;
    recipients: User[];
  } | null>(null);
  const [requestKey, setRequestKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  async function refresh() {
    const data = await adminRequest("/api/admin/messages");
    setMessages(data.messages);
    setDeliveries(data.deliveries);
    setConfigured(data.emailConfigured);
  }
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("userId");
    if (id) setUserIds([id]);
    setRequestKey(crypto.randomUUID());
    void refresh().catch((e) => setFeedback(e.message));
  }, []);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      void adminRequest(`/api/admin/users?q=${encodeURIComponent(query)}`)
        .then((data) => {
          if (active) setUsers(data.users);
        })
        .catch((e) => {
          if (active) setFeedback(e.message);
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);
  useEffect(() => {
    setPreview(null);
  }, [subject, body, audience, userIds, sendEmail]);
  async function submit(confirm = false) {
    setBusy(true);
    setFeedback("");
    try {
      const data = await adminRequest("/api/admin/messages", "POST", {
        requestKey,
        subject,
        body,
        audience,
        userIds,
        sendEmail,
        preview: !confirm,
      });
      if (!confirm) {
        setPreview(data);
        setConfigured(data.emailConfigured);
      } else {
        setFeedback(
          "Message publié dans Quivibe. Les e-mails demandés sont placés dans la file d’envoi.",
        );
        setPreview(null);
        setSubject("");
        setBody("");
        setRequestKey(crypto.randomUUID());
        if (sendEmail && configured) {
          try {
            const result = await processEmailQueue();
            setFeedback(
              `Message publié dans Quivibe. ${result.sent} e-mails acceptés par le prestataire, ${result.failed} en échec. Consultez le suivi pour les envois restants.`,
            );
          } catch {
            setFeedback(
              "Message publié dans Quivibe. Le traitement des e-mails a été interrompu ; les envois restants sont conservés dans la file.",
            );
          }
        }
        await refresh();
      }
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Opération impossible.");
    } finally {
      setBusy(false);
    }
  }
  async function deliver() {
    setBusy(true);
    try {
      const result = await processEmailQueue();
      setFeedback(
        result.unavailable
          ? "Configurez Resend pour envoyer les e-mails en attente."
          : `${result.sent} e-mails acceptés par le prestataire ; ${result.failed} échecs sur ce lot.`,
      );
      await refresh();
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Envoi interrompu.");
    } finally {
      setBusy(false);
    }
  }
  const statusNames: Record<string, string> = {
    PENDING: "en attente",
    SENDING: "en cours",
    SENT: "acceptés par Resend",
    FAILED: "en échec",
    SKIPPED: "e-mail non envoyé",
    NOT_REQUESTED: "dans Quivibe uniquement",
  };
  return (
    <main>
      <h1 className="text-3xl font-extrabold">Messages aux utilisateurs</h1>
      <p className="mt-2 text-gray-600">
        Messages individuels ou groupés, avec boîte de réception privée dans
        Quivibe.
      </p>
      {feedback && (
        <p role="status" className="my-4 rounded-xl border bg-white p-4">
          {feedback}
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="mt-6 rounded-2xl border bg-white p-5"
      >
        <fieldset disabled={busy} className="space-y-4">
          <label className="block font-bold">
            Destinataires
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="mt-2 block w-full rounded-xl border p-3"
            >
              <option value="SELECTED">Sélection personnelle</option>
              <option value="ALL">Tous les comptes actifs</option>
              <option value="USER">Utilisateurs</option>
              <option value="OWNER">Propriétaires</option>
              <option value="ADMIN">Administrateurs</option>
            </select>
          </label>
          {audience === "SELECTED" && (
            <div>
              <label className="block text-sm font-bold">
                Chercher des destinataires
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="mt-2 block w-full rounded-xl border p-3"
                />
              </label>
              <p className="my-2 text-sm">
                {userIds.length} destinataire(s) sélectionné(s)
              </p>
              <div className="max-h-52 space-y-2 overflow-auto">
                {users.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={userIds.includes(user.id)}
                      onChange={(e) =>
                        setUserIds(
                          e.target.checked
                            ? [...userIds, user.id]
                            : userIds.filter((id) => id !== user.id),
                        )
                      }
                    />
                    {user.name} — {user.email}
                  </label>
                ))}
              </div>
            </div>
          )}
          <label className="block font-bold">
            Sujet
            <input
              required
              minLength={2}
              maxLength={160}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-2 block w-full rounded-xl border p-3"
            />
          </label>
          <label className="block font-bold">
            Message
            <textarea
              required
              minLength={2}
              maxLength={5000}
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-2 block w-full rounded-xl border p-3"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
            />
            Envoyer aussi par e-mail
          </label>
          <button
            type="submit"
            className="rounded-xl bg-gray-950 px-5 py-3 font-bold text-white"
          >
            Prévisualiser
          </button>
        </fieldset>
      </form>
      {preview && (
        <section className="mt-5 rounded-2xl border border-primary-300 bg-primary-50 p-5">
          <h2 className="font-bold">Vérifier avant envoi</h2>
          <p className="mt-2">
            {preview.count} destinataire(s) dans Quivibe
            {sendEmail
              ? `, dont ${preview.emailCount} avec un e-mail vérifié`
              : ""}
            .
          </p>
          {preview.recipients.length > 0 && (
            <ul
              aria-label="Destinataires du message"
              className="mt-3 max-h-40 overflow-auto text-sm"
            >
              {preview.recipients.map((recipient) => (
                <li key={recipient.id}>
                  {recipient.name} — {recipient.email}
                </li>
              ))}
            </ul>
          )}
          <h3 className="mt-4 font-bold">{subject}</h3>
          <p className="mt-2 whitespace-pre-wrap break-words">{body}</p>
          {sendEmail && !configured && (
            <p className="mt-3 text-amber-800">
              Resend n’est pas configuré : les e-mails resteront en attente.
            </p>
          )}
          <button
            type="button"
            disabled={busy || preview.count === 0}
            onClick={() => void submit(true)}
            className="mt-5 rounded-xl bg-primary-600 px-5 py-3 font-bold text-white disabled:opacity-50"
          >
            {busy ? "Envoi…" : "Confirmer l’envoi"}
          </button>
        </section>
      )}
      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Historique et suivi</h2>
          <button
            disabled={busy}
            onClick={() => void deliver()}
            className="rounded-xl border bg-white px-4 py-2"
          >
            Traiter les e-mails en attente
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Les e-mails sont traités par lots. Une acceptation par Resend ne
          garantit pas la réception en boîte de messagerie.
        </p>
        <div className="mt-4 space-y-3">
          {messages.map((message) => (
            <article
              key={message.id}
              className="rounded-xl border bg-white p-4"
            >
              <h3 className="font-bold">{message.subject}</h3>
              <p className="text-sm text-gray-600">
                {message._count.recipients} destinataire(s) ·{" "}
                {new Date(message.createdAt).toLocaleString("fr-FR")}
              </p>
              <p className="mt-2 text-sm">
                {deliveries
                  .filter((item) => item.messageId === message.id)
                  .map(
                    (item) =>
                      `${item._count} ${statusNames[item.emailStatus] || item.emailStatus}`,
                  )
                  .join(" · ")}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
