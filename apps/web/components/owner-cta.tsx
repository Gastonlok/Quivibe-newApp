"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Store, Users, Star, TrendingUp } from "lucide-react";

export function OwnerCTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-primary-600 to-primary-700 py-16 md:py-20">
      {/* Effet de fond */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center text-white"
        >
          <Store className="w-16 h-16 mx-auto mb-6 opacity-80" />

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Vous êtes propriétaire d'un établissement ?
          </h2>
          <p className="text-xl text-primary-50 mb-8 max-w-2xl mx-auto">
            Rejoignez Quivibe et augmentez votre visibilité. Attirez de nouveaux clients et gérez votre réputation en ligne.
          </p>

          {/* Avantages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Users className="w-8 h-8 mx-auto mb-3 text-primary-200" />
              <h3 className="font-semibold mb-2">+ de clients</h3>
              <p className="text-sm text-primary-100">
                Attirez une communauté active de Kinois en quête de nouvelles expériences
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Star className="w-8 h-8 mx-auto mb-3 text-primary-200" />
              <h3 className="font-semibold mb-2">Gérez votre réputation</h3>
              <p className="text-sm text-primary-100">
                Répondez aux avis et améliorez votre note en temps réel
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <TrendingUp className="w-8 h-8 mx-auto mb-3 text-primary-200" />
              <h3 className="font-semibold mb-2">Visibilité accrue</h3>
              <p className="text-sm text-primary-100">
                Soyez recommandé aux bons utilisateurs au bon moment
              </p>
            </div>
          </div>

          <Link
            href="/owner/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-full hover:shadow-xl transition-all hover:scale-105"
          >
            Créer ma page établissement
            <ArrowRight className="w-5 h-5" />
          </Link>

          <p className="mt-4 text-sm text-primary-200">
            Déjà propriétaire ? <Link href="/owner/login" className="underline hover:text-white transition-colors">Connectez-vous</Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
