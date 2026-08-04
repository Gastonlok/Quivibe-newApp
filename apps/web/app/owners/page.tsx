"use client";

import { useState } from "react";
import {
  Users,
  TrendingUp,
  Star,
  BarChart3,
  Smartphone,
  Award,
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  Loader2,
  ArrowRight,
  Building2,
  Target,
  Sparkles,
  Shield,
  Clock,
  PartyPopper,
  Music,
  Coffee,
  Utensils,
  Wine
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function OwnersPage() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    establishmentName: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    establishmentType: "",
    message: "",
  });

  const establishmentTypes = [
    { value: "restaurant", label: "Restaurant", icon: Utensils },
    { value: "bar", label: "Bar", icon: Wine },
    { value: "lounge", label: "Lounge", icon: Coffee },
    { value: "rooftop", label: "Rooftop", icon: PartyPopper },
    { value: "club", label: "Club", icon: Music },
    { value: "other", label: "Autre", icon: Building2 },
  ];

  const benefits = [
    {
      icon: Users,
      title: "Visibilité accrue",
      description: "Soyez découvert par des milliers de Kinois à la recherche de nouvelles expériences de sortie.",
    },
    {
      icon: Star,
      title: "Gestion de la réputation",
      description: "Recevez des avis authentiques et gérez votre note en temps réel pour améliorer votre image.",
    },
    {
      icon: TrendingUp,
      title: "Augmentation de votre clientèle",
      description: "Attirez de nouveaux clients grâce à nos recommandations personnalisées et à notre communauté active.",
    },
    {
      icon: BarChart3,
      title: "Analyses et statistiques",
      description: "Suivez vos performances, consultez vos statistiques et adaptez votre offre en temps réel.",
    },
    {
      icon: Smartphone,
      title: "Présence mobile",
      description: "Votre établissement accessible partout, tout le temps, sur mobile et desktop.",
    },
    {
      icon: Award,
      title: "Reconnaissance et mise en avant",
      description: "Mettez en avant vos spécialités, vos événements exclusifs et vos distinctions.",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/owners/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormSubmitted(true);
        setFormData({
          establishmentName: "",
          contactName: "",
          email: "",
          phone: "",
          address: "",
          establishmentType: "",
          message: "",
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  if (formSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Message envoyé !</h2>
          <p className="text-gray-600 mt-3 text-lg">
            Merci pour votre intérêt ! Un membre de notre équipe vous contactera dans les plus brefs délais.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Nous revenons vers vous sous 24-48h.
          </p>
          <Link
            href="/"
            className="inline-block mt-6 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-700 text-white py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Building2 className="w-16 h-16 mb-6 text-primary-200" />
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Rejoignez Quivibe
              </h1>
              <p className="text-xl text-primary-100 mb-6 max-w-2xl">
                Faites découvrir votre espace de sortie aux milliers de Kinois qui cherchent de nouvelles expériences.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="#contact"
                  className="px-8 py-3 bg-white text-primary-600 font-semibold rounded-full hover:shadow-xl transition-all hover:scale-105 inline-flex items-center gap-2"
                >
                  Devenir partenaire
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="#benefits"
                  className="px-8 py-3 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-full hover:bg-white/30 transition-all inline-flex items-center gap-2"
                >
                  Voir les avantages
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Avantages */}
      <section id="benefits" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Pourquoi rejoindre Quivibe ?</h2>
            <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
              Des avantages concrets pour développer votre activité et fidéliser vos clients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {benefit.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section Statistiques */}
      <section className="bg-white py-16 border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary-500">500+</p>
              <p className="text-gray-600 text-sm mt-1">Utilisateurs actifs</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary-500">100+</p>
              <p className="text-gray-600 text-sm mt-1">Établissements partenaires</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary-500">1K+</p>
              <p className="text-gray-600 text-sm mt-1">Avis vérifiés</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary-500">4.8</p>
              <p className="text-gray-600 text-sm mt-1">Note moyenne</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Types d'établissements */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Qui peut rejoindre Quivibe ?</h2>
            <p className="text-gray-600 mt-2">
              Tous les espaces de sortie sont les bienvenus
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {establishmentTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div key={type.value} className="bg-white px-6 py-3 rounded-full shadow-sm border border-gray-200 flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary-500" />
                  <span className="text-sm font-medium text-gray-700">{type.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section Formulaire de contact */}
      <section id="contact" className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Devenir partenaire</h2>
              <p className="text-gray-600 mt-1">
                Remplissez ce formulaire et nous vous contacterons rapidement
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'établissement *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      required
                      placeholder="Le Jardin des Saveurs"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={formData.establishmentName}
                      onChange={(e) => setFormData({ ...formData, establishmentName: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Votre nom *
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      required
                      placeholder="Jean Dupont"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      required
                      placeholder="contact@etablissement.com"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      required
                      placeholder="+243 812 345 678"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type d'établissement *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                      value={formData.establishmentType}
                      onChange={(e) => setFormData({ ...formData, establishmentType: e.target.value })}
                    >
                      <option value="">Sélectionnez un type</option>
                      {establishmentTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="12 Avenue de la Gombe, Kinshasa"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  rows={4}
                  placeholder="Parlez-nous de votre établissement..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Envoyer ma demande
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-4">
              En soumettant ce formulaire, vous acceptez d'être contacté par notre équipe.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
