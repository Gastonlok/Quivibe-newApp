
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle, Clock, User, Store, MapPin, Eye } from "lucide-react";

interface OwnerRequest {
  id: string;
  user: { name: string; email: string };
  placeName: string;
  placeAddress: string;
  placePhone: string | null;
  description: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  adminNote: string | null;
}

export default function AdminOwnerRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<OwnerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<OwnerRequest | null>(null);
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "ADMIN") {
      router.push("/");
      return;
    }
    fetchRequests();
  }, [session, status, router]);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/admin/owner-requests");
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId: string, action: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/admin/owner-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action, adminNote }),
      });

      if (res.ok) {
        await fetchRequests();
        setSelectedRequest(null);
        setAdminNote("");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-700",
      APPROVED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
    };
    const labels = {
      PENDING: "En attente",
      APPROVED: "Approuvé",
      REJECTED: "Rejeté",
    };
    return {
      style: styles[status as keyof typeof styles] || styles.PENDING,
      label: labels[status as keyof typeof labels] || status,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const pendingCount = requests.filter(r => r.status === "PENDING").length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Demandes propriétaires</h1>
        <p className="text-gray-500 mt-1">
          {pendingCount} demande{pendingCount > 1 ? "s" : ""} en attente de validation
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Demandeur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Établissement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Aucune demande pour le moment
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const { style, label } = getStatusBadge(req.status);
                  return (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{req.user.name}</p>
                            <p className="text-xs text-gray-500">{req.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{req.placeName}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <MapPin className="w-3 h-3" />
                              {req.placeAddress}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>
                          {label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(req.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de traitement */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Traiter la demande
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Demandeur</p>
                <p className="font-medium">{selectedRequest.user.name}</p>
                <p className="text-sm text-gray-500">{selectedRequest.user.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Établissement</p>
                <p className="font-medium">{selectedRequest.placeName}</p>
                <p className="text-sm text-gray-500">{selectedRequest.placeAddress}</p>
              </div>

              {selectedRequest.description && (
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedRequest.description}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500 mb-1">Note (optionnel)</p>
                <textarea
                  rows={3}
                  placeholder="Ajouter une note..."
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleAction(selectedRequest.id, "APPROVED")}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approuver
              </button>
              <button
                onClick={() => handleAction(selectedRequest.id, "REJECTED")}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Refuser
              </button>
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
