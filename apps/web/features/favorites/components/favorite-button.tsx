"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toggleFavorite, isFavorite } from "../actions";
import { motion } from "framer-motion";

interface FavoriteButtonProps {
  placeId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function FavoriteButton({ placeId, className = "", size = "md" }: FavoriteButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  // Vérifier l'état initial
  useEffect(() => {
    if (status === "authenticated" && placeId) {
      isFavorite(placeId).then((result) => {
        setIsFavorited(result.isFavorite);
      });
    }
  }, [placeId, status]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    setLoading(true);
    const result = await toggleFavorite(placeId);

    if (result.success) {
      setIsFavorited(result.action === "added");
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleToggle}
      disabled={loading}
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-colors ${
        isFavorited
          ? "bg-red-50 text-red-500 hover:bg-red-100"
          : "bg-white/90 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-white"
      } ${className} ${
        loading ? "opacity-50 cursor-wait" : ""
      }`}
      aria-label={isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <Heart
        className={`${iconSizes[size]} transition-all ${
          isFavorited ? "fill-red-500 text-red-500" : ""
        }`}
      />
    </motion.button>
  );
}
