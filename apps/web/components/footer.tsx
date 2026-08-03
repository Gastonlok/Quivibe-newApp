"use client";

import Link from "next/link";
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Smartphone,
  Store,
  Users,
  Star,
  Heart,
  Shield,
  Clock,
  Utensils,
  Coffee,
  Wine,
  Music,
  PartyPopper
} from "lucide-react";
import { motion } from "framer-motion";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Newsletter Section */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Recevez nos recommandations
              </h3>
              <p className="text-gray-400">
                Les meilleures adresses et événements à Kinshasa, directement dans votre boîte mail.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Votre email"
                className="flex-1 px-4 py-3 rounded-full bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
              />
              <button className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-full transition-colors flex items-center justify-center gap-2 whitespace-nowrap">
                S'abonner
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Quivibe</span>
            </Link>
            <p className="text-sm text-gray-400 mb-4">
              La plateforme qui aide les Congolais à découvrir où sortir à Kinshasa.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-9 h-9 bg-gray-800 hover:bg-primary-500 rounded-full flex items-center justify-center transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-gray-800 hover:bg-primary-500 rounded-full flex items-center justify-center transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-gray-800 hover:bg-primary-500 rounded-full flex items-center justify-center transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-gray-800 hover:bg-primary-500 rounded-full flex items-center justify-center transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Pour les utilisateurs */}
          <div>
            <h4 className="text-white font-semibold mb-4">Pour les utilisateurs</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/discover" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <Star className="w-3.5 h-3.5" />
                  Découvrir
                </Link>
              </li>
              <li>
                <Link href="/map" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  Carte interactive
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5" />
                  Mes favoris
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <PartyPopper className="w-3.5 h-3.5" />
                  Événements
                </Link>
              </li>
            </ul>
          </div>

          {/* Pour les professionnels */}
          <div>
            <h4 className="text-white font-semibold mb-4">Pour les professionnels</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/owner/register" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <Store className="w-3.5 h-3.5" />
                  Créer ma page
                </Link>
              </li>
              <li>
                <Link href="/owner/login" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  Gérer mes avis
                </Link>
              </li>
              <li>
                <Link href="/owner/pricing" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" />
                  Devenir premium
                </Link>
              </li>
            </ul>
          </div>

          {/* À propos */}
          <div>
            <h4 className="text-white font-semibold mb-4">À propos</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Qui sommes-nous
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Conditions générales
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-400">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary-400" />
                <span>contact@quivibe.com</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-400">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary-400" />
                <span>+243 812 345 678</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-400">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary-400" />
                <span>Kinshasa, République Démocratique du Congo</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © {currentYear} Quivibe. Tous droits réservés.
            </p>
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <Link href="/privacy" className="text-gray-500 hover:text-gray-300 transition-colors">
                Politique de confidentialité
              </Link>
              <Link href="/terms" className="text-gray-500 hover:text-gray-300 transition-colors">
                CGU
              </Link>
              <Link href="/cookies" className="text-gray-500 hover:text-gray-300 transition-colors">
                Cookies
              </Link>
              <div className="flex items-center gap-2 text-gray-500">
                <span>🇨🇩</span>
                <span className="text-xs">Made in Kinshasa</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
