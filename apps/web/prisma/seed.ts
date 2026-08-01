import { PrismaClient } from "@prisma/client";
import { slugify } from "../utils/slugify";

const prisma = new PrismaClient();

const CATEGORIES = ["Restaurant", "Bar", "Lounge", "Café", "Rooftop", "Club"];

async function main() {
  for (const name of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
  }

  console.log(`Seed terminé : ${CATEGORIES.length} catégories créées.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
