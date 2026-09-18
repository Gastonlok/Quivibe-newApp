import type { Prisma } from "@prisma/client";

// A selected cover has priority -1; other images retain their upload order.
export const placeMediaOrder: Prisma.MediaOrderByWithRelationInput[] = [
  { sortOrder: "asc" },
  { createdAt: "asc" },
  { id: "asc" },
];
