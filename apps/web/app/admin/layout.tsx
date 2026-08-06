"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Shield, Users, Store, Star, Settings, LogOut, BarChart3,
  MessageSquare, Bell, AlertTriangle, Building2
} from "lucide-react";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(() => {
    if (pathname.includes("/admin/users")) return "users";
    if (pathname.includes("/admin/places")) return "places";
    if (pathname.includes("/admin/reviews")) return "reviews";
    if (pathname.includes("/admin/owner-requests")) return "owner-requests";
    if (pathname.includes("/admin/settings")) return "settings";
    return "overview";
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="flex-1">
            {children}
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
    { id: "overview", label: "Vue d'ensemble", icon: BarChart3, href: "/admin/dashboard" },
    { id: "users", label: "Utilisateurs", icon: Users, href: "/admin/users" },
    { id: "places", label: "Établissements", icon: Store, href: "/admin/places" },
    { id: "reviews", label: "Avis", icon: Star, href: "/admin/reviews" },
    { id: "owner-requests", label: "Demandes", icon: AlertTriangle, href: "/admin/owner-requests" },
    { id: "settings", label: "Paramètres", icon: Settings, href: "/admin/settings" },
  ];

  return (
    <div className="lg:w-64 flex-shrink-0">
      <div className="bg-white rounded-xl shadow-sm p-4 sticky top-24 border border-gray-100">
        <div className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                  isActive ? "bg-primary-50 text-primary-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Link>
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
