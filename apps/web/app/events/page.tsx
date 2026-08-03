"use client";

import { useState } from "react";
import {
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Users,
  Filter,
  Search,
  ChevronRight,
  Heart,
  Share2,
  Ticket,
  Music,
  Utensils,
  Wine,
  PartyPopper
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

// ✅ Déplacer la fonction formatDate en dehors du composant principal
const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

// Données mock
const EVENTS = [
  {
    id: 1,
    title: "Soirée Jazz au Jardin",
    description: "Concert de jazz en plein air avec les meilleurs artistes locaux",
    date: "2026-08-15",
    time: "19:00",
    location: "Le Jardin des Saveurs",
    category: "Musique",
    price: "Gratuit",
    image: "https://picsum.photos/seed/jazz/400/300",
    attendees: 45,
    organizer: "Le Jardin des Saveurs",
    tags: ["Jazz", "Concert", "Gratuit"]
  },
  {
    id: 2,
    title: "Afterwork Sky Lounge",
    description: "Afterwork avec cocktails et DJ set sur le rooftop",
    date: "2026-08-20",
    time: "18:00",
    location: "Sky Lounge",
    category: "Soirée",
    price: "10 000 FC",
    image: "https://picsum.photos/seed/afterwork/400/300",
    attendees: 78,
    organizer: "Sky Lounge",
    tags: ["Afterwork", "DJ", "Cocktails"]
  },
  {
    id: 3,
    title: "Dîner aux chandelles",
    description: "Dîner romantique avec menu spécial 5 plats",
    date: "2026-08-25",
    time: "20:00",
    location: "Chez Maman African",
    category: "Gastronomie",
    price: "25 000 FC",
    image: "https://picsum.photos/seed/dinner/400/300",
    attendees: 32,
    organizer: "Chez Maman African",
    tags: ["Dîner", "Romantique", "Gastronomie"]
  },
  {
    id: 4,
    title: "Brunch du dimanche",
    description: "Brunch gourmand avec buffet à volonté",
    date: "2026-08-28",
    time: "11:00",
    location: "Le Café de la Gare",
    category: "Brunch",
    price: "15 000 FC",
    image: "https://picsum.photos/seed/brunch/400/300",
    attendees: 56,
    organizer: "Le Café de la Gare",
    tags: ["Brunch", "Buffet", "Famille"]
  },
  {
    id: 5,
    title: "Soirée Afrobeats",
    description: "La plus grosse soirée Afrobeats de la ville",
    date: "2026-08-30",
    time: "22:00",
    location: "The Rooftop Bar",
    category: "Soirée",
    price: "15 000 FC",
    image: "https://picsum.photos/seed/afrobeats/400/300",
    attendees: 120,
    organizer: "The Rooftop Bar",
    tags: ["Afrobeats", "Soirée", "DJ"]
  },
];

const CATEGORIES = ["Tous", "Musique", "Soirée", "Gastronomie", "Brunch", "Conférence"];

export default function EventsPage() {
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEvents = EVENTS.filter((event) => {
    const matchesCategory = selectedCategory === "Tous" || event.category === selectedCategory;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          event.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold">Événements</h1>
          <p className="text-primary-50 mt-2">
            Découvrez les événements près de chez vous
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Barre de recherche et filtres */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Rechercher un événement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
          <button className="px-4 py-3 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm">Filtres</span>
          </button>
        </div>

        {/* Catégories */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-primary-500 text-white shadow-lg shadow-primary-200"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Résultats */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {filteredEvents.length} événements trouvés
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "grid" ? "bg-primary-50 text-primary-600" : "text-gray-400"
              }`}
            >
              <span className="text-sm">Grille</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "list" ? "bg-primary-50 text-primary-600" : "text-gray-400"
              }`}
            >
              <span className="text-sm">Liste</span>
            </button>
          </div>
        </div>

        {/* Liste des événements */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-gray-900">Aucun événement trouvé</h3>
            <p className="text-gray-500 mt-1">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className={viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
          }>
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} viewMode={viewMode} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ✅ Composant EventCard avec accès à formatDate
function EventCard({ event, viewMode }: { event: typeof EVENTS[0]; viewMode: "grid" | "list" }) {
  const [isHovered, setIsHovered] = useState(false);

  if (viewMode === "list") {
    return (
      <Link href={`/events/${event.id}`}>
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row"
        >
          <div className="relative md:w-48 h-48 md:h-auto flex-shrink-0">
            <Image
              src={event.image}
              alt={event.title}
              fill
              className="object-cover"
            />
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              <span className="text-white text-xs font-medium">{formatDate(event.date)}</span>
            </div>
          </div>
          <div className="p-4 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900 text-lg">{event.title}</h3>
                <button className="p-1.5 hover:bg-gray-100 rounded-full">
                  <Heart className="w-5 h-5 text-gray-400 hover:text-red-500" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {event.time}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {event.location}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <span className="text-primary-600 font-semibold">{event.price}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{event.attendees} participants</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link href={`/events/${event.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all h-full flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative h-48 overflow-hidden">
          <Image
            src={event.image}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-300"
            style={{ transform: isHovered ? "scale(1.05)" : "scale(1)" }}
          />
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md">
            <p className="text-xs font-semibold text-gray-800">
              {formatDate(event.date)}
            </p>
          </div>
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <span className="text-white text-xs font-medium">{event.category}</span>
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 line-clamp-1">{event.title}</h3>
            <button className="p-1.5 hover:bg-gray-100 rounded-full flex-shrink-0">
              <Heart className="w-4 h-4 text-gray-400 hover:text-red-500" />
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-1 line-clamp-2 flex-1">{event.description}</p>

          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {event.time}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span className="truncate max-w-[100px]">{event.location}</span>
            </span>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <div>
              <span className="text-primary-600 font-semibold">{event.price}</span>
              <p className="text-xs text-gray-400">{event.attendees} participants</p>
            </div>
            <button className="px-4 py-1.5 bg-primary-500 text-white text-sm rounded-full hover:bg-primary-600 transition-colors">
              S'inscrire
            </button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
