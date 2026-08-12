// apps/web/app/admin/reviews/[reviewId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Star, User, Trash2, CheckCircle, XCircle } from "lucide-react";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Review {
  id: string;
  rating: number;
  comment: string;
  status: string;
  createdAt: string;
  author: { name: string; email: string };
  place: { name: string; slug: string };
}

export default function AdminReviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "ADMIN") {
      router.push("/");
      return;
    }
    fetchReviews();
  }, [session, status, router]);

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/admin/reviews");
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error("Erreur:", error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reviewId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await fetchReviews();
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet avis ?")) return;
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchReviews();
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    if (filter === "all") return true;
    return review.status === filter;
  });

  const statusColors = {
    APPROVED: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  const statusLabels = {
    APPROVED: "Approuvé",
    PENDING: "En attente",
    REJECTED: "Rejeté",
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Avis</h1>
            <p className="text-gray-500 mt-1">{reviews.length} avis sur la plateforme</p>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Tous</option>
            <option value="APPROVED">Approuvés</option>
            <option value="PENDING">En attente</option>
            <option value="REJECTED">Rejetés</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500">Aucun avis trouvé</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{review.author.name}</p>
                      <p className="text-xs text-gray-500">{review.author.email}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{review.rating}/5</span>
                    </div>
                    <p className="text-gray-700 mt-2">{review.comment}</p>
                    <p className="text-sm text-gray-500 mt-1">Sur <strong>{review.place.name}</strong></p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[review.status as keyof typeof statusColors]}`}>
                    {statusLabels[review.status as keyof typeof statusLabels]}
                  </span>
                  <div className="flex gap-1">
                    {review.status === "PENDING" && (
                      <>
                        <button onClick={() => handleStatusChange(review.id, "APPROVED")} className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors" title="Approuver">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleStatusChange(review.id, "REJECTED")} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Rejeter">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button onClick={() => handleDelete(review.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
