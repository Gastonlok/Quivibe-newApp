"use client";

import { useState } from "react";
import {
  Store,
  Calendar,
  Users,
  Star,
  TrendingUp,
  Clock,
  Settings,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  MessageSquare,
  Bell,
  Search,
  Filter
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("7d");

  // Données mock pour le dashboard
  const stats = {
    views: 1247,
    reservations: 48,
    rating: 4.8,
    reviews: 89,
    conversion: 12.5
  };

  const recentReviews = [
    { id: 1, user: "Marie K.", rating: 5, comment: "Excellent restaurant ! Je reviendrai", date: "Il y a 2h" },
    { id: 2, user: "Jean P.", rating: 4, comment: "Très bonne cuisine, service impeccable", date: "Il y a 5h" },
    { id: 3, user: "Sophie M.", rating: 5, comment: "Une découverte exceptionnelle !", date: "Il y a 1j" }
  ];

  const upcomingReservations = [
    { id: 1, name: "Dupont", time: "20:00", guests: 4, phone: "+243 812345678" },
    { id: 2, name: "Mbemba", time: "21:30", guests: 2, phone: "+243 987654321" },
    { id: 3, name: "Kanda", time: "19:30", guests: 6, phone: "+243 765432198" }
  ];

  const topDishes = [
    { name: "Poulet Braisé", orders: 45, revenue: 450000 },
    { name: "Poisson Fumé", orders: 38, revenue: 380000 },
    { name: "Fufu Pondu", orders: 32, revenue: 320000 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barre de navigation du dashboard */}
      <DashboardNav />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <DashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Contenu principal */}
          <div className="flex-1">
            {activeTab === "overview" && (
              <>
                {/* En-tête avec statistiques */}
                <div className="mb-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
                      <p className="text-gray-500">Bienvenue dans votre espace propriétaire</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-full hover:bg-primary-600 transition-colors flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Nouvel événement
                      </button>
                      <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-full hover:bg-gray-50 transition-colors border border-gray-200">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {dateRange === "7d" ? "7 jours" : "30 jours"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cartes de statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                  <StatCard
                    icon={Eye}
                    label="Vues"
                    value={stats.views}
                    change="+12%"
                    color="primary"
                  />
                  <StatCard
                    icon={Calendar}
                    label="Réservations"
                    value={stats.reservations}
                    change="+8%"
                    color="green"
                  />
                  <StatCard
                    icon={Star}
                    label="Note moyenne"
                    value={stats.rating}
                    change="+0.2"
                    color="yellow"
                  />
                  <StatCard
                    icon={MessageSquare}
                    label="Avis"
                    value={stats.reviews}
                    change="+15%"
                    color="blue"
                  />
                  <StatCard
                    icon={TrendingUp}
                    label="Conversion"
                    value={stats.conversion + "%"}
                    change="+2.5%"
                    color="purple"
                  />
                </div>

                {/* Graphique et activités */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {/* Graphique des réservations */}
                  <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Activité récente</h3>
                      <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5">
                        <option>Cette semaine</option>
                        <option>Ce mois</option>
                        <option>Cette année</option>
                      </select>
                    </div>
                    <div className="h-64 flex items-end gap-2">
                      {[45, 62, 38, 51, 42, 58, 70].map((value, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${value * 2}px` }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="w-full bg-gradient-to-t from-primary-400 to-primary-500 rounded-lg relative group cursor-pointer"
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {value} réservations
                            </div>
                          </motion.div>
                          <span className="text-xs text-gray-400">J{i+1}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Plats populaires */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4">Plats populaires</h3>
                    <div className="space-y-4">
                      {topDishes.map((dish, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800">{dish.name}</p>
                            <p className="text-sm text-gray-500">{dish.orders} commandes</p>
                          </div>
                          <span className="text-sm font-semibold text-primary-600">
                            {dish.revenue.toLocaleString()} FC
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Réservations et avis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Réservations à venir */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Réservations à venir</h3>
                      <Link href="/owner/reservations" className="text-sm text-primary-500 hover:text-primary-600">
                        Voir tout
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {upcomingReservations.map((res) => (
                        <div key={res.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div>
                            <p className="font-medium text-gray-800">{res.name}</p>
                            <p className="text-sm text-gray-500">{res.guests} personnes • {res.phone}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-primary-600">{res.time}</span>
                            <button className="block text-xs text-gray-400 hover:text-gray-600">Confirmer</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Derniers avis */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Derniers avis</h3>
                      <Link href="/owner/reviews" className="text-sm text-primary-500 hover:text-primary-600">
                        Voir tout
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {recentReviews.map((review) => (
                        <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-800">{review.user}</p>
                              <div className="flex items-center gap-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                ))}
                              </div>
                            </div>
                            <span className="text-xs text-gray-400">{review.date}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "menu" && <MenuManagement />}
            {activeTab === "events" && <EventsManagement />}
            {activeTab === "reservations" && <ReservationsManagement />}
            {activeTab === "reviews" && <ReviewsManagement />}
            {activeTab === "settings" && <SettingsManagement />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Composants du dashboard

function DashboardNav() {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/owner/dashboard" className="flex items-center gap-2">
            <Store className="w-6 h-6 text-primary-500" />
            <span className="font-bold text-lg">Mon Restaurant</span>
          </Link>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-semibold text-sm">P</span>
              </div>
              <span className="text-sm font-medium text-gray-700 hidden md:block">Patrick</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function DashboardSidebar({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  const tabs = [
    { id: "overview", label: "Vue d'ensemble", icon: BarChart3 },
    { id: "menu", label: "Gestion du menu", icon: Utensils },
    { id: "events", label: "Événements", icon: Calendar },
    { id: "reservations", label: "Réservations", icon: Users },
    { id: "reviews", label: "Avis", icon: Star },
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
                  isActive
                    ? "bg-primary-50 text-primary-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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

function StatCard({ icon: Icon, label, value, change, color }: any) {
  const colors = {
    primary: "bg-primary-50 text-primary-600",
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
          {change}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-3">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

// Pages de gestion (à implémenter)
function MenuManagement() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-xl font-bold mb-4">Gestion du menu</h2>
      <p className="text-gray-500">Ajoutez, modifiez ou supprimez vos plats ici.</p>
    </div>
  );
}

function EventsManagement() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-xl font-bold mb-4">Événements</h2>
      <p className="text-gray-500">Créez et gérez vos événements spéciaux.</p>
    </div>
  );
}

function ReservationsManagement() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-xl font-bold mb-4">Réservations</h2>
      <p className="text-gray-500">Consultez et gérez toutes vos réservations.</p>
    </div>
  );
}

function ReviewsManagement() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-xl font-bold mb-4">Avis</h2>
      <p className="text-gray-500">Consultez et répondez aux avis de vos clients.</p>
    </div>
  );
}

function SettingsManagement() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-xl font-bold mb-4">Paramètres</h2>
      <p className="text-gray-500">Gérez les informations de votre établissement.</p>
    </div>
  );
}
