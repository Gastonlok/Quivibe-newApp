"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Star, MapPin, Users } from "lucide-react";

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
              <span className="text-xs font-medium text-primary-700">🔥 Kinshasa</span>
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

          {/* Images */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="relative h-48 rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src="https://picsum.photos/seed/restaurant1/400/300"
                    alt="Restaurant chic"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                <div className="relative h-64 rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src="https://picsum.photos/seed/lounge/400/400"
                    alt="Lounge bar"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="relative h-64 rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src="https://picsum.photos/seed/rooftop/400/400"
                    alt="Rooftop"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                <div className="relative h-48 rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src="https://picsum.photos/seed/event/400/300"
                    alt="Événement"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
