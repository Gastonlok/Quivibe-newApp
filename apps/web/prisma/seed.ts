// apps/web/prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Créer les catégories (une par une pour éviter les doublons)
  const categories = [
    { name: 'Restaurant', slug: 'restaurant' },
    { name: 'Bar', slug: 'bar' },
    { name: 'Lounge', slug: 'lounge' },
    { name: 'Rooftop', slug: 'rooftop' },
    { name: 'Café', slug: 'cafe' },
    { name: 'Fast Food', slug: 'fast-food' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log(`✅ ${categories.length} catégories créées/mises à jour`);

  // 2. Créer un utilisateur de test
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      name: 'Utilisateur Test',
      email: 'test@example.com',
      passwordHash: 'test_hash',
      role: 'USER',
    },
  });

  // 3. Créer un propriétaire de test
  const owner = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      name: 'Propriétaire Test',
      email: 'owner@example.com',
      passwordHash: 'owner_hash',
      role: 'OWNER',
    },
  });

  console.log('✅ Utilisateurs de test créés');

  // 4. Récupérer les catégories pour les relations
  const categoriesList = await prisma.category.findMany();

  // 5. Créer des établissements de test
  const places = [
    {
      name: 'Le Jardin des Saveurs',
      slug: 'le-jardin-des-saveurs',
      description: 'Restaurant chic proposant une cuisine fusion africaine et européenne. Ambiance chaleureuse et service impeccable.',
      address: '12 Avenue de la Gombe',
      neighborhood: 'Gombe',
      latitude: -4.325,
      longitude: 15.325,
      priceRange: 3,
      phone: '+243 812345678',
      ownerId: owner.id,
      status: 'APPROVED',
      categories: ['restaurant'],
    },
    {
      name: 'Sky Lounge',
      slug: 'sky-lounge',
      description: 'Un lounge en hauteur avec une vue imprenable sur Kinshasa. Cocktails raffinés et musique lounge.',
      address: '45 Boulevard du 30 Juin',
      neighborhood: 'Gombe',
      latitude: -4.318,
      longitude: 15.312,
      priceRange: 4,
      phone: '+243 998765432',
      ownerId: owner.id,
      status: 'APPROVED',
      categories: ['lounge', 'rooftop'],
    },
    {
      name: 'Chez Maman African',
      slug: 'chez-maman-african',
      description: 'Cuisine traditionnelle congolaise dans une ambiance familiale. Spécialités : fufu, pondu, et poisson braisé.',
      address: '89 Avenue Kasa-Vubu',
      neighborhood: 'Lemba',
      latitude: -4.385,
      longitude: 15.318,
      priceRange: 2,
      phone: '+243 815556677',
      ownerId: owner.id,
      status: 'APPROVED',
      categories: ['restaurant'],
    },
    {
      name: 'The Rooftop Bar',
      slug: 'the-rooftop-bar',
      description: 'Le meilleur rooftop de la ville. Idéal pour les couchers de soleil et les soirées entre amis.',
      address: '15 Rue de la Révolution',
      neighborhood: 'Gombe',
      latitude: -4.322,
      longitude: 15.308,
      priceRange: 3,
      phone: '+243 897654321',
      ownerId: owner.id,
      status: 'APPROVED',
      categories: ['bar', 'rooftop'],
    },
    {
      name: 'Café de la Gare',
      slug: 'cafe-de-la-gare',
      description: 'Un charmant café situé près de la gare centrale. Parfait pour un petit-déjeuner ou une pause café.',
      address: '5 Place de la Gare',
      neighborhood: 'Limete',
      latitude: -4.340,
      longitude: 15.334,
      priceRange: 1,
      phone: '+243 823334455',
      ownerId: owner.id,
      status: 'PENDING',
      categories: ['cafe'],
    },
  ];

  for (const placeData of places) {
    // Vérifier si l'établissement existe déjà
    const existingPlace = await prisma.place.findUnique({
      where: { slug: placeData.slug },
    });

    if (existingPlace) {
      console.log(`⏭️  Établissement déjà existant: ${placeData.name}`);
      continue;
    }

    const place = await prisma.place.create({
      data: {
        name: placeData.name,
        slug: placeData.slug,
        description: placeData.description,
        address: placeData.address,
        neighborhood: placeData.neighborhood,
        latitude: placeData.latitude,
        longitude: placeData.longitude,
        priceRange: placeData.priceRange,
        phone: placeData.phone,
        ownerId: placeData.ownerId,
        status: placeData.status,
        categories: {
          create: placeData.categories.map((categorySlug) => ({
            category: {
              connect: {
                slug: categorySlug,
              },
            },
          })),
        },
        media: {
          create: [
            {
              url: `https://picsum.photos/seed/${placeData.slug}/800/600`,
              altText: `${placeData.name} - Photo principale`,
            },
          ],
        },
      },
    });
    console.log(`✅ Établissement créé: ${place.name}`);
  }

  // 6. Créer des avis de test
  const reviews = [
    {
      rating: 5,
      comment: 'Excellent restaurant ! La nourriture est délicieuse et le service est top.',
      authorId: user.id,
      placeSlug: 'le-jardin-des-saveurs',
    },
    {
      rating: 4,
      comment: 'Super ambiance, mais un peu cher pour ce que c\'est.',
      authorId: user.id,
      placeSlug: 'sky-lounge',
    },
    {
      rating: 5,
      comment: 'Les meilleurs fufu de Kinshasa ! Je recommande vivement.',
      authorId: user.id,
      placeSlug: 'chez-maman-african',
    },
    {
      rating: 4,
      comment: 'Vue magnifique, cocktails excellents.',
      authorId: user.id,
      placeSlug: 'the-rooftop-bar',
    },
  ];

  for (const reviewData of reviews) {
    const place = await prisma.place.findUnique({
      where: { slug: reviewData.placeSlug },
    });

    if (place) {
      // Vérifier si l'avis existe déjà
      const existingReview = await prisma.review.findFirst({
        where: {
          authorId: reviewData.authorId,
          placeId: place.id,
        },
      });

      if (!existingReview) {
        await prisma.review.create({
          data: {
            rating: reviewData.rating,
            comment: reviewData.comment,
            authorId: reviewData.authorId,
            placeId: place.id,
            status: 'APPROVED',
          },
        });
        console.log(`✅ Avis créé pour ${place.name}`);
      } else {
        console.log(`⏭️  Avis déjà existant pour ${place.name}`);
      }
    }
  }

  console.log('🎉 Seed terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
