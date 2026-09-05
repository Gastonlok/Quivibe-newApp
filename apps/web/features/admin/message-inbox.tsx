"use client";
import { useEffect, useRef, useState } from "react";
type Item = {
  id: string;
  readAt: string | null;
  message: { subject: string; body: string; createdAt: string };
};
export function MessageInbox() {
  const reading = useRef(new Set<string>());
  const [messages, setMessages] = useState<Item[]>([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/messages?page=${page}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setMessages(data.messages);
        setTotal(data.total);
        setUnread(data.unread);
        setError("");
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page]);
  async function read(id: string) {
    if (reading.current.has(id)) return;
    reading.current.add(id);
    try {
      const response = await fetch("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok)
        throw new Error("Impossible de marquer ce message comme lu.");
      setMessages((items) =>
        items.map((item) =>
          item.id === id ? { ...item, readAt: new Date().toISOString() } : item,
        ),
      );
      setUnread((n) => Math.max(0, n - 1));
    } catch (e) {
      reading.current.delete(id);
      setError(e instanceof Error ? e.message : "Réessayez.");
    }
  }
  return (
    <main className="container max-w-3xl py-10">
      <h1 className="text-3xl font-extrabold">Mes messages</h1>
      <p className="mt-2 text-gray-600">
        Messages Quivibe et suivi des réservations · {unread} non lu(s)
      </p>
      {error && (
        <p role="alert" className="mt-4 text-red-700">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status" className="mt-6">
          Chargement…
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {!messages.length && <p>Aucun message pour le moment.</p>}
          {messages.map((item) => (
            <article
              key={item.id}
              className={`rounded-2xl border p-5 ${item.readAt ? "bg-white" : "border-primary-300 bg-primary-50"}`}
            >
              <h2 className="text-lg font-bold">{item.message.subject}</h2>
              <p className="mt-1 text-xs text-gray-500">
                {new Date(item.message.createdAt).toLocaleString("fr-FR")}
              </p>
              <p className="mt-4 whitespace-pre-wrap break-words">
                {item.message.body}
              </p>
              {!item.readAt && (
                <button
                  onClick={() => void read(item.id)}
                  className="mt-4 font-bold text-primary-700"
                >
                  Marquer comme lu
                </button>
              )}
            </article>
          ))}
        </div>
      )}
      <div className="mt-6 flex items-center justify-between">
        <button
          disabled={page === 1 || loading}
          onClick={() => setPage(page - 1)}
        >
          Précédent
        </button>
        <span>Page {page}</span>
        <button
          disabled={page * 30 >= total || loading}
          onClick={() => setPage(page + 1)}
        >
          Suivant
        </button>
      </div>
    </main>
  );
}
