"use client";

import { useState } from "react";
import {
  Shield, Users, Store, Star, Settings, LogOut, BarChart3,
  MessageSquare, Bell, CheckCircle, XCircle, Eye, Filter,
  AlertTriangle, Activity, Building2
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

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
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="flex-1">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <QuickAction icon={Building2} label="Modérer les établissements" count={stats.pendingPlaces} color="primary" onClick={() => setActiveTab("places")} />
              <QuickAction icon={MessageSquare} label="Modérer les avis" count={stats.pendingReviews} color="yellow" onClick={() => setActiveTab("reviews")} />
              <QuickAction icon={AlertTriangle} label="Signalements" count={stats.reportedReviews} color="red" onClick={() => setActiveTab("reports")} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminNav() {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary-500" />
            <span className="font-bold text-lg">Quivibe Admin</span>
          </Link>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-semibold text-sm">A</span>
              </div>
              <span className="text-sm font-medium text-gray-700 hidden md:block">Admin</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function AdminSidebar({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  const tabs = [
    { id: "overview", label: "Vue d'ensemble", icon: BarChart3 },
    { id: "places", label: "Établissements", icon: Store },
    { id: "reviews", label: "Avis", icon: Star },
    { id: "reports", label: "Signalements", icon: AlertTriangle },
    { id: "users", label: "Utilisateurs", icon: Users },
    { id: "settings", label: "Paramètres", icon: Settings },
  ];

  return (
    <div className="lg:w-64 flex-shrink-0">
      <div className="bg-white rounded-xl shadow-sm p-4 sticky top-24 border border-gray-100">
        <div className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                  isActive ? "bg-primary-50 text-primary-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="border-t border-gray-200 mt-4 pt-4">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminStatCard({ icon: Icon, label, value, change, color, subtitle }: any) {
  const colors = {
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

function QuickAction({ icon: Icon, label, count, color, onClick }: any) {
  const colors = {
    primary: "bg-primary-50 hover:bg-primary-100 text-primary-600",
    yellow: "bg-yellow-50 hover:bg-yellow-100 text-yellow-600",
    red: "bg-red-50 hover:bg-red-100 text-red-600",
  };

  return (
    <button onClick={onClick} className={`p-4 rounded-xl ${colors[color]} transition-colors text-left`}>
      <div className="flex items-center justify-between">
        <Icon className="w-5 h-5" />
        {count > 0 && <span className="bg-white px-2 py-0.5 rounded-full text-xs font-semibold">{count}</span>}
      </div>
      <p className="font-medium mt-2">{label}</p>
    </button>
  );
}
