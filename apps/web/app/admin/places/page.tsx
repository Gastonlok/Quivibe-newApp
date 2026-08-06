"use client";

import { useEffect, useState } from "react";
import {
  Store, Search, Loader2, Eye, CheckCircle, XCircle,
  Building2, MapPin, Star, Calendar, Filter, Trash2,
  Clock, AlertCircle, Plus
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CreatePlaceModal } from "@/components/admin/create-place-modal";

interface Place {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  neighborhood: string;
  status: string;
  priceRange: number;
  createdAt: string;
  owner: {
    name: string;
    email: string;
  };
  _count: {
    reviews: number;
    favorites: number;
    events: number;
  };
}

export default function AdminPlacesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterNeighborhood, setFilterNeighborhood] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "ADMIN") {
      router.push("/");
      return;
    }
    fetchPlaces();
  }, [session, status, router]);

  const fetchPlaces = async () => {
    try {
      const res = await fetch("/api/admin/places");
      const data = await res.json();
      setPlaces(data.places || []);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (placeId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/places/${placeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await fetchPlaces();
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleDeletePlace = async (placeId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet établissement ?")) return;

    try {
      const res = await fetch(`/api/admin/places/${placeId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchPlaces();
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const filteredPlaces = places.filter((place) => {
    const matchesSearch = place.name.toLowerCase().includes(search.toLowerCase()) ||
                          place.owner.name.toLowerCase().includes(search.toLowerCase()) ||
                          place.neighborhood.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || place.status === filterStatus;
    const matchesNeighborhood = filterNeighborhood === "all" || place.neighborhood === filterNeighborhood;
    return matchesSearch && matchesStatus && matchesNeighborhood;
  });

  const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  const statusLabels = {
    PENDING: "En attente",
    APPROVED: "Approuvé",
    REJECTED: "Rejeté",
  };

  const neighborhoods = [...new Set(places.map(p => p.neighborhood))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Store className="w-8 h-8 text-primary-500" />
              Établissements
            </h1>
            <p className="text-gray-500 mt-1">{places.length} établissements sur la plateforme</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Créer un établissement
            </button>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors.APPROVED}`}>
                {places.filter(p => p.status === "APPROVED").length} approuvés
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors.PENDING}`}>
                {places.filter(p => p.status === "PENDING").length} en attente
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors.REJECTED}`}>
                {places.filter(p => p.status === "REJECTED").length} rejetés
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un établissement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="APPROVED">Approuvés</option>
          <option value="REJECTED">Rejetés</option>
        </select>
        <select
          value={filterNeighborhood}
          onChange={(e) => setFilterNeighborhood(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">Tous les quartiers</option>
          {neighborhoods.map((hood) => (
            <option key={hood} value={hood}>{hood}</option>
          ))}
        </select>
        <button
          onClick={fetchPlaces}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          Rafraîchir
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Établissement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propriétaire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Localisation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activité
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPlaces.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Aucun établissement trouvé
                  </td>
                </tr>
              ) : (
                filteredPlaces.map((place) => (
                  <tr key={place.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          <Store className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{place.name}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">
                            {place.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{place.owner.name}</p>
                      <p className="text-xs text-gray-500">{place.owner.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-600">{place.neighborhood}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[place.status as keyof typeof statusColors]}`}>
                        {statusLabels[place.status as keyof typeof statusLabels]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5" />
                          {place._count.reviews}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {place._count.events}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {place.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleStatusChange(place.id, "APPROVED")}
                              className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                              title="Approuver"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(place.id, "REJECTED")}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Rejeter"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {place.status === "APPROVED" && (
                          <button
                            onClick={() => handleStatusChange(place.id, "REJECTED")}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Désapprouver"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {place.status === "REJECTED" && (
                          <button
                            onClick={() => handleStatusChange(place.id, "PENDING")}
                            className="p-1.5 text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Remettre en attente"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        )}
                        <Link
                          href={`/places/${place.slug}`}
                          target="_blank"
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Voir la fiche"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeletePlace(place.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de création */}
      <CreatePlaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchPlaces}
      />
    </div>
  );
}
