"use client";

import { useState, type ReactNode } from "react";
import { CalendarClock, LayoutPanelTop, MenuSquare, Users } from "lucide-react";

type TabId = "profile" | "menu" | "activity" | "team";

const tabs = [
  { id: "profile" as const, label: "Fiche", icon: LayoutPanelTop },
  { id: "menu" as const, label: "Carte", icon: MenuSquare },
  { id: "activity" as const, label: "Activité", icon: CalendarClock },
  { id: "team" as const, label: "Équipe", icon: Users },
];

export function OwnerPlaceWorkspace({
  profile,
  menu,
  activity,
  team,
}: {
  profile: ReactNode;
  menu: ReactNode;
  activity: ReactNode;
  team: ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const panels: Record<TabId, ReactNode> = { profile, menu, activity, team };

  return (
    <section className="mt-8">
      <nav
        aria-label="Sections de gestion de l'établissement"
        className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-3"
      >
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-extrabold transition ${
                active
                  ? "bg-primary-600 text-white shadow-soft"
                  : "bg-white text-gray-600 hover:bg-primary-50 hover:text-primary-800"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </nav>
      <div className="mt-6">{panels[activeTab]}</div>
    </section>
  );
}
