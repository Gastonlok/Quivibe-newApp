"use client";
import { useState } from "react";
import { UtensilsCrossed } from "lucide-react";

export function MenuItemImage({ url, name }: { url: string; name: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return failedUrl === url ? (
    <span
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500 sm:h-20 sm:w-20"
      aria-label={`Photo indisponible : ${name}`}
    >
      <UtensilsCrossed className="h-6 w-6" />
    </span>
  ) : (
    // Uploaded photos have a bounded size and a Cloudinary URL validated on save.
    <img
      src={url}
      alt={name || "Photo du plat"}
      width={80}
      height={80}
      loading="lazy"
      decoding="async"
      onError={() => setFailedUrl(url)}
      className="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-20 sm:w-20"
    />
  );
}
