"use client";

import {
  Shield, Users, Store, Star,
  MessageSquare, AlertTriangle, Activity
} from "lucide-react";

// ✅ Ajouter le type pour les couleurs
type ColorKey = "blue" | "green" | "yellow" | "purple" | "red";
type ActionColorKey = "primary" | "yellow" | "red";

export default function AdminDashboard() {
  const stats = {
    totalUsers: 1250,
    totalPlaces: 245,
    totalReviews: 1890,
    pendingPlaces: 12,
    pendingReviews: 8,
    reportedReviews: 5,
    activeUsers: 340,
    conversionRate: 15.2
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary-500" />
              Administration
            </h1>
            <p className="text-gray-500">Gérez votre plateforme Quivibe</p>
          </div>
          <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            Plateforme active
          </span>
        </div>
      </div>

      {(stats.pendingPlaces > 0 || stats.pendingReviews > 0) && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Action requise</p>
              <p className="text-sm text-yellow-700">
                {stats.pendingPlaces} établissements et {stats.pendingReviews} avis en attente de modération.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <AdminStatCard icon={Users} label="Utilisateurs" value={stats.totalUsers} change="+12%" color="blue" subtitle={`${stats.activeUsers} actifs`} />
        <AdminStatCard icon={Store} label="Établissements" value={stats.totalPlaces} change="+8%" color="green" subtitle={`${stats.pendingPlaces} en attente`} />
        <AdminStatCard icon={Star} label="Avis" value={stats.totalReviews} change="+15%" color="yellow" subtitle={`${stats.pendingReviews} à modérer`} />
        <AdminStatCard icon={Activity} label="Taux de conversion" value={stats.conversionRate + "%"} change="+2.5%" color="purple" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickAction icon={MessageSquare} label="Modérer les avis" count={stats.pendingReviews} color="yellow" href="/admin/reviews" />
        <QuickAction icon={AlertTriangle} label="Signalements" count={stats.reportedReviews} color="red" href="/admin/reports" />
      </div>
    </div>
  );
}

// ✅ Composant avec typage explicite
function AdminStatCard({
  icon: Icon,
  label,
  value,
  change,
  color,
  subtitle
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  change: string;
  color: ColorKey;
  subtitle?: string;
}) {
  const colors: Record<ColorKey, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">{change}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-3">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

// ✅ Composant avec typage explicite
function QuickAction({
  icon: Icon,
  label,
  count,
  color,
  href
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  color: ActionColorKey;
  href: string;
}) {
  const colors: Record<ActionColorKey, string> = {
    primary: "bg-primary-50 hover:bg-primary-100 text-primary-600",
    yellow: "bg-yellow-50 hover:bg-yellow-100 text-yellow-600",
    red: "bg-red-50 hover:bg-red-100 text-red-600",
  };

  return (
    <a href={href} className={`p-4 rounded-xl ${colors[color]} transition-colors text-left block`}>
      <div className="flex items-center justify-between">
        <Icon className="w-5 h-5" />
        {count > 0 && <span className="bg-white px-2 py-0.5 rounded-full text-xs font-semibold">{count}</span>}
      </div>
      <p className="font-medium mt-2">{label}</p>
    </a>
  );
}
