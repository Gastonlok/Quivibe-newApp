"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Star, MapPin, Users, Utensils } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Texte */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-100 rounded-full mb-6">
              <span className="text-xs font-medium text-primary-700">🇨🇩 Kinshasa</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Découvrez les lieux
              <span className="text-primary-500 block">qui font vibrer Kinshasa</span>
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-lg">
              Quivibe est votre guide pour explorer les meilleurs restaurants, bars, lounges et événements de la capitale.
              Des recommandations authentiques, des avis fiables, et une communauté qui partage sa passion pour la vie nocturne kinoise.
            </p>

            {/* Statistiques */}
            <div className="mt-8 flex flex-wrap gap-8">
              <div className="flex items-center gap-2">
                <div className="bg-primary-50 p-2 rounded-full">
                  <Star className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">500+</p>
                  <p className="text-sm text-gray-500">Avis vérifiés</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-primary-50 p-2 rounded-full">
                  <MapPin className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">100+</p>
                  <p className="text-sm text-gray-500">Établissements</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-primary-50 p-2 rounded-full">
                  <Users className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">1K+</p>
                  <p className="text-sm text-gray-500">Membres</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Images - Drapeau RDC + Restaurants + Plats */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-3">
              {/* Colonne gauche */}
              <div className="space-y-3">
                {/* ✅ Drapeau de la RDC */}
                <div className="relative h-48 rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Flag_of_the_Democratic_Republic_of_the_Congo.svg/1280px-Flag_of_the_Democratic_Republic_of_the_Congo.svg.png"
                    alt="Drapeau de la République Démocratique du Congo"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white text-xs font-medium bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                    <span>🇨🇩</span>
                    RDC
                  </div>
                </div>
                {/* Plat gastronomique */}
                <div className="relative h-32 rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop"
                    alt="Cuisine gastronomique"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-2 left-2 text-white text-xs font-medium bg-black/50 px-2 py-0.5 rounded-full">
                    🍽️ Gastronomie
                  </div>
                </div>
              </div>

              {/* Colonne droite */}
              <div className="space-y-3 pt-8">
                {/* Restaurant chic */}
                <div className="relative h-32 rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop"
                    alt="Restaurant chic"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-2 left-2 text-white text-xs font-medium bg-black/50 px-2 py-0.5 rounded-full">
                    🏙️ Restaurant
                  </div>
                </div>
                {/* Plat traditionnel */}
                <div className="relative h-48 rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop"
                    alt="Cuisine traditionnelle"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-full">
                    🌍 Cuisine locale
                  </div>
                </div>
              </div>
            </div>

            {/* Badge flottant */}
            <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <Utensils className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">6+ lieux</p>
                <p className="text-xs text-gray-500">À découvrir</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
