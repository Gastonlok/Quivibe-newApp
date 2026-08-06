"use client";

import { useState, useRef, useEffect } from "react";
import { PlaceCard } from "@/features/places/components/place-card";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface CarouselSectionProps {
  title: string;
  icon: React.ReactNode;
  items: any[];
  viewAllLink?: string;
  itemsPerView?: number;
}

export function CarouselSection({
  title,
  icon,
  items,
  viewAllLink,
  itemsPerView = 4
}: CarouselSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const cardWidth = 280; // Largeur fixe d'une carte
      const gap = 24;
      const scrollAmount = (cardWidth + gap) * itemsPerView;
      containerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
        </div>
        {viewAllLink && (
          <Link
            href={viewAllLink}
            className="text-sm text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1"
          >
            Voir tout <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="relative group">
        {/* Bouton gauche */}
        <button
          onClick={() => scroll('left')}
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all duration-300 ${
            canScrollLeft ? 'opacity-100' : 'opacity-0 cursor-default'
          } group-hover:opacity-100`}
          style={{ transform: 'translateY(-50%)' }}
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        {/* Container des cartes */}
        <div
          ref={containerRef}
          onScroll={checkScroll}
          className="flex overflow-x-auto gap-6 pb-4 scroll-smooth"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          <div className="flex gap-6 min-w-max">
            {items.map((place, index) => (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
                className="w-[280px] flex-shrink-0"
              >
                <PlaceCard place={place} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bouton droit */}
        <button
          onClick={() => scroll('right')}
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all duration-300 ${
            canScrollRight ? 'opacity-100' : 'opacity-0 cursor-default'
          } group-hover:opacity-100`}
          style={{ transform: 'translateY(-50%)' }}
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// SKELETON POUR LE CHARGEMENT
// ============================================
export function CarouselSkeleton() {
  return (
    <div className="flex gap-6 overflow-hidden">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="w-[280px] flex-shrink-0">
          <div className="animate-pulse">
            <div className="bg-gray-200 h-56 rounded-t-xl"></div>
            <div className="p-4 space-y-3 bg-white rounded-b-xl">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
