"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { useEffect, useState } from "react";

type PlaceImage = { url: string; altText: string | null };

interface PlaceGalleryProps { placeName: string; media: PlaceImage[]; }

export function PlaceGallery({ placeName, media }: PlaceGalleryProps) {
  const images = media.length > 0 ? media : [{ url: "/images/placeholder.jpg", altText: null }];
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const imageCount = images.length;

  useEffect(() => {
    if (activeIndex === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowLeft") setActiveIndex((index) => index === null ? null : (index - 1 + imageCount) % imageCount);
      if (event.key === "ArrowRight") setActiveIndex((index) => index === null ? null : (index + 1) % imageCount);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, imageCount]);

  const imageAlt = (image: PlaceImage, index: number) => image.altText || `Photo ${index + 1} de ${placeName}`;
  const openImage = (index: number) => setActiveIndex(index);

  if (imageCount === 1) {
    return <GalleryButton image={images[0]} imageAlt={imageAlt(images[0], 0)} onClick={() => openImage(0)} className="h-[19rem] sm:h-[25rem]" priority />;
  }

  return (
    <>
      <section aria-label={`Galerie photos de ${placeName}`} className="grid h-[21rem] grid-cols-2 gap-2 overflow-hidden rounded-[1.75rem] bg-gray-200 sm:h-[27rem] sm:grid-cols-4">
        <GalleryButton image={images[0]} imageAlt={imageAlt(images[0], 0)} onClick={() => openImage(0)} className="row-span-2" priority />
        <GalleryButton image={images[1]} imageAlt={imageAlt(images[1], 1)} onClick={() => openImage(1)} className="row-span-2 hidden sm:block" />
        <GalleryButton image={images[2] ?? images[0]} imageAlt={imageAlt(images[2] ?? images[0], 2)} onClick={() => openImage(Math.min(2, imageCount - 1))} className="hidden sm:block" />
        <GalleryButton image={images[3] ?? images[1]} imageAlt={imageAlt(images[3] ?? images[1], 3)} onClick={() => openImage(Math.min(3, imageCount - 1))} className="relative" overlay={imageCount > 4 ? `+${imageCount - 4} photos` : "Voir les photos"} />
      </section>

      {activeIndex !== null && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-gray-950/90 p-4" role="dialog" aria-modal="true" aria-label={`Galerie complète de ${placeName}`}>
          <button type="button" onClick={() => setActiveIndex(null)} className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white text-gray-950 shadow-lg" aria-label="Fermer la galerie"><X className="h-5 w-5" /></button>
          <button type="button" onClick={() => setActiveIndex((activeIndex - 1 + imageCount) % imageCount)} className="absolute left-4 grid h-11 w-11 place-items-center rounded-full bg-white/95 text-gray-950 shadow-lg sm:left-8" aria-label="Photo précédente"><ChevronLeft className="h-6 w-6" /></button>
          <div className="relative h-[70vh] w-full max-w-5xl overflow-hidden rounded-2xl"><Image src={images[activeIndex].url} alt={imageAlt(images[activeIndex], activeIndex)} fill sizes="(max-width: 768px) 100vw, 1024px" className="object-contain" priority /></div>
          <button type="button" onClick={() => setActiveIndex((activeIndex + 1) % imageCount)} className="absolute right-4 grid h-11 w-11 place-items-center rounded-full bg-white/95 text-gray-950 shadow-lg sm:right-8" aria-label="Photo suivante"><ChevronRight className="h-6 w-6" /></button>
          <p className="absolute bottom-6 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur">{activeIndex + 1} / {imageCount}</p>
        </div>
      )}
    </>
  );
}

function GalleryButton({ image, imageAlt, onClick, className, overlay, priority = false }: { image: PlaceImage; imageAlt: string; onClick: () => void; className?: string; overlay?: string; priority?: boolean }) {
  return <button type="button" onClick={onClick} className={`group relative min-h-0 overflow-hidden bg-gray-300 text-left focus:outline-none focus:ring-4 focus:ring-primary-400 ${className ?? ""}`} aria-label={`Agrandir ${imageAlt}`}><Image src={image.url} alt={imageAlt} fill priority={priority} sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" />{overlay && <span className="absolute inset-0 grid place-items-center gap-2 bg-gray-950/55 text-center text-sm font-extrabold text-white backdrop-blur-[1px]"><Images className="h-6 w-6" />{overlay}</span>}</button>;
}
