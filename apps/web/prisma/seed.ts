// apps/web/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================
// COLLECTION D'IMAGES RÉELLES
// ============================================
const IMAGES = {
  restaurants: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1515516969-d4008cc6241a?w=800&h=600&fit=crop',
  ],
  bars: [
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1541647376583-8934aaf3448a?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop',
  ],
  lounges: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1572119865084-43c285814d63?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=800&h=600&fit=crop',
  ],
  plats: [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1551326844-4df70f78d0e9?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&h=600&fit=crop',
  ],
};

// ============================================
// DONNÉES DES 20 ÉTABLISSEMENTS
// ============================================
const placesData = [
  // ===== RESTAURANTS (10) =====
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
    categories: ['restaurant'],
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop',
    ],
    plats: [
      'https://images.unsplash.com/photo-1551326844-4df70f78d0e9?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop',
    ],
  },
  {
    name: 'La Table du Chef',
    slug: 'la-table-du-chef',
    description: 'Cuisine gastronomique française avec des produits locaux. Une expérience culinaire unique à Kinshasa.',
    address: '45 Avenue des Artistes',
    neighborhood: 'Gombe',
    latitude: -4.318,
    longitude: 15.312,
    priceRange: 4,
    phone: '+243 998765432',
    categories: ['restaurant'],
    images: [
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop',
    ],
    plats: [
      'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?w=800&h=600&fit=crop',
    ],
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
    categories: ['restaurant'],
    images: [
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&h=600&fit=crop',
    ],
    plats: [
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=600&fit=crop',
    ],
  },
  {
    name: 'Le Bistrot Parisien',
    slug: 'le-bistrot-parisien',
    description: 'Un authentique bistrot français au cœur de Kinshasa. Escargots, foie gras, et vins fins.',
    address: '78 Avenue du Commerce',
    neighborhood: 'Gombe',
    latitude: -4.320,
    longitude: 15.308,
    priceRange: 3,
    phone: '+243 823334455',
    categories: ['restaurant'],
    images: [
      'https://images.unsplash.com/photo-1515516969-d4008cc6241a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&h=600&fit=crop',
    ],
    plats: [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop',
    ],
  },
  {
    name: 'Saveurs d\'Asie',
    slug: 'saveurs-dasie',
    description: 'Cuisine asiatique fusion : sushis, ramen, et plats thaïlandais. Une explosion de saveurs.',
    address: '34 Avenue du Fleuve',
    neighborhood: 'Mont Ngafula',
    latitude: -4.350,
    longitude: 15.290,
    priceRange: 3,
    phone: '+243 812223333',
    categories: ['restaurant'],
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=600&fit=crop',
    ],
    plats: [
      'https://images.unsplash.com/photo-1551326844-4df70f78d0e9?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop',
    ],
  },
  {
    name: 'La Paillote',
    slug: 'la-paillote',
    description: 'Restaurant en bord de rivière avec des grillades et des fruits de mer. Idéal pour les déjeuners en famille.',
    address: '56 Route de l\'Aéroport',
    neighborhood: 'Ndjili',
    latitude: -4.340,
    longitude: 15.334,
    priceRange: 2,
    phone: '+243 897654321',
    categories: ['restaurant'],
    images: [
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800&h=600&fit=crop',
    ],
    plats: [
      'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&h=600&fit=crop',
    ],
  },
  {
    name: 'Le Méditerranéen',
    slug: 'le-mediterraneen',
    description: 'Cuisine méditerranéenne : tapas, paella, et poissons grillés. Une ambiance conviviale.',
    address: '23 Avenue des Plages',
    neighborhood: 'Limete',
    latitude: -4.335,
    longitude: 15.340,
    priceRange: 3,
    phone: '+243 812334455',
    categories: ['restaurant'],
    images: [
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop',
    ],
    plats: [
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop',
    ],
  },
  {
    name: 'Au Petit Marché',
    slug: 'au-petit-marche',
    description: 'Brunch et cuisine bio. Produits frais et locaux dans une ambiance décontractée.',
    address: '12 Rue des Mamans',
    neighborhood: 'Selembao',
    latitude: -4.345,
    longitude: 15.310,
    priceRange: 2,
    phone: '+243 815556688',
    categories: ['restaurant', 'cafe'],
    images: [
      'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop',
    ],
    plats: [
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1551326844-4df70f78d0e9?w=800&h=600&fit=crop',
    ],
  },
  {
    name: 'La Terrasse du Congo',
    slug: 'la-terrasse-du-congo',
    description: 'Une terrasse panoramique offrant une vue spectaculaire sur le fleuve Congo. Cuisine internationale.',
    address: '25 Boulevard du Fleuve',
    neighborhood: 'Mont Ngafula',
    latitude: -4.350,
    longitude: 15.290,
    priceRange: 3,
    phone: '+243 812223333',
    categories: ['restaurant', 'lounge'],
    images: [
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
    ],
    plats: [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop',
    ],
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
    categories: ['cafe'],
    images: [
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&h=600&fit=crop',
    ],
    plats: [
      'https://images.unsplash.com/photo-1551326844-4df70f78d0e9?w=800&h=600&fit=crop',
    ],
  },

  // ===== BARS & LOUNGES (6) =====
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
    categories: ['lounge', 'rooftop'],
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&h=600&fit=crop',
    ],
    plats: [
      'https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?w=800&h=600&fit=crop',
    ],
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
    categories: ['bar', 'rooftop'],
    images: [
      'https://images.unsplash.com/photo-1572119865084-43c285814d63?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=800&h=600&fit=crop',
    ],
    plats: [
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop',
    ],
  },
  {
    name: 'Le 7ème Ciel',
    slug: 'le-7eme-ciel',
    description: 'Bar lounge avec une vue imprenable sur la ville. Ambiance chic et cocktails signatures.',
    address: '78 Avenue des Artistes',
    neighborhood: 'Gombe',
    latitude: -4.320,
    longitude: 15.305,
    priceRange: 4,
    phone: '+243 812334466',
    categories: ['lounge', 'bar'],
    images: [
      'https://images.unsplash.com/photo-1541647376583-8934aaf3448a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&h=600&fit=crop',
    ],
    plats: [
      'https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?w=800&h=600&fit=crop',
    ],
  },
  {
    name: 'Bar du Fleuve',
    slug: 'bar-du-fleuve',
    description: 'Un bar en bord de fleuve avec des couchers de soleil magnifiques. Musique live le week-end.',
    address: '12 Promenade du Fleuve',
    neighborhood: 'Mont Ngafula',
    latitude: -4.355,
    longitude: 15.285,
    priceRange: 3,
    phone: '+243 812223344',
    categories: ['bar'],
    images: [
      'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&h=600&fit=crop',
    ],
    plats: [
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop',
    ],
  },
  {
    name: 'Le 360 Lounge',
    slug: 'le-360-lounge',
    description: 'Lounge panoramique avec une vue à 360 degrés sur Kinshasa. Idéal pour les afterworks.',
    address: '34 Avenue de l\'Indépendance',
    neighborhood: 'Gombe',
    latitude: -4.325,
    longitude: 15.315,
    priceRange: 4,
    phone: '+243 815556699',
    categories: ['lounge'],
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=800&h=600&fit=crop',
    ],
    plats: [
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop',
    ],
  },
  {
    name: 'La Cave à Vins',
    slug: 'la-cave-a-vins',
    description: 'Bar à vins avec une sélection de plus de 100 références. Planches de charcuterie et fromages.',
    address: '56 Avenue des Vins',
    neighborhood: 'Lemba',
    latitude: -4.390,
    longitude: 15.320,
    priceRange: 3,
    phone: '+243 822334455',
    categories: ['bar'],
    images: [
      'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&h=600&fit=crop',
    ],
    plats: [
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop',
    ],
  },

  // ===== AUTRES (4) =====
  {
    name: 'La Guinguette',
    slug: 'la-guinguette',
    description: 'Un espace convivial avec des jeux de société, des planches à partager et des cocktails.',
    address: '78 Avenue de la Paix',
    neighborhood: 'Selembao',
    latitude: -4.348,
    longitude: 15.308,
    priceRange: 2,
    phone: '+243 812334477',
    categories: ['lounge', 'bar'],
    images: [
      'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
    ],
    plats: [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1551326844-4df70f78d0e9?w=800&h=600&fit=crop',
    ],
  },
  {
    name: 'Le Food Truck Park',
    slug: 'le-food-truck-park',
    description: 'Un espace avec plusieurs food trucks proposant des cuisines du monde entier. Ambiance festive.',
    address: '23 Place de l\'Indépendance',
    neighborhood: 'Gombe',
    latitude: -4.315,
    longitude: 15.320,
    priceRange: 2,
    phone: '+243 897654322',
    categories: ['restaurant', 'fast-food'],
    images: [
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800&h=600&fit=crop',
    ],
    plats: [
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=600&fit=crop',
    ],
  },
  {
    name: 'Le Jardin Secret',
    slug: 'le-jardin-secret',
    description: 'Un jardin caché au cœur de la ville avec une cuisine fusion et des cocktails exclusifs.',
    address: '45 Impasse des Fleurs',
    neighborhood: 'Kalamu',
    latitude: -4.370,
    longitude: 15.325,
    priceRange: 3,
    phone: '+243 812334488',
    categories: ['restaurant', 'lounge'],
    images: [
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
    ],
    plats: [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop',
    ],
  },
  {
    name: 'Le Rooftop des Artistes',
    slug: 'le-rooftop-des-artistes',
    description: 'Un rooftop dédié aux artistes locaux avec des expositions, des concerts et une cuisine créative.',
    address: '12 Rue des Artistes',
    neighborhood: 'Gombe',
    latitude: -4.318,
    longitude: 15.310,
    priceRange: 3,
    phone: '+243 812334499',
    categories: ['rooftop', 'bar'],
    images: [
      'https://images.unsplash.com/photo-1572119865084-43c285814d63?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=800&h=600&fit=crop',
    ],
    plats: [
      'https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop',
    ],
  },
];

// ============================================
// FONCTION PRINCIPALE
// ============================================
async function main() {
  console.log('🌱 Seeding 20 restaurants with real images...');

  // 1. Créer les catégories
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
  console.log(`✅ ${categories.length} catégories créées`);

  // 2. Créer les utilisateurs
  const password = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@quivibe.com' },
    update: {},
    create: {
      name: 'Admin Quivibe',
      email: 'admin@quivibe.com',
      passwordHash: password,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin créé');

  const owner = await prisma.user.upsert({
    where: { email: 'owner@quivibe.com' },
    update: {},
    create: {
      name: 'Propriétaire Test',
      email: 'owner@quivibe.com',
      passwordHash: password,
      role: 'OWNER',
      ownerStatus: 'APPROVED',
    },
  });
  console.log('✅ Owner créé');

  const user = await prisma.user.upsert({
    where: { email: 'user@quivibe.com' },
    update: {},
    create: {
      name: 'Utilisateur Test',
      email: 'user@quivibe.com',
      passwordHash: password,
      role: 'USER',
    },
  });
  console.log('✅ Utilisateur créé');

  // 3. Créer les 20 établissements
  let createdCount = 0;
  for (const placeData of placesData) {
    const existingPlace = await prisma.place.findUnique({
      where: { slug: placeData.slug },
    });

    if (existingPlace) {
      console.log(`⏭️  Établissement déjà existant: ${placeData.name}`);
      continue;
    }

    const shuffledImages = [...placeData.images].sort(() => Math.random() - 0.5);
    const shuffledPlats = [...placeData.plats].sort(() => Math.random() - 0.5);

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
        ownerId: owner.id,
        status: 'APPROVED',
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
            ...shuffledImages.slice(0, 3).map((url, index) => ({
              url,
              altText: `${placeData.name} - Vue ${index + 1}`,
            })),
            ...shuffledPlats.slice(0, 2).map((url, index) => ({
              url,
              altText: `${placeData.name} - Plat ${index + 1}`,
            })),
          ],
        },
      },
    });

    createdCount++;
    const mediaCount = await prisma.media.count({
      where: { placeId: place.id },
    });
    console.log(`✅ ${createdCount}/20: ${place.name} (${mediaCount} images)`);
  }

  // 4. Créer des avis
  const reviewComments = [
    'Excellent ! Je recommande vivement ce lieu.',
    'Très bonne expérience, service impeccable.',
    'Ambiance géniale, je reviendrai sans hésiter.',
    'Cuisine délicieuse, cadre magnifique.',
    'Un super endroit pour sortir entre amis.',
    'Le meilleur restaurant de Kinshasa !',
    'Service rapide et plats savoureux.',
    'Une découverte exceptionnelle.',
    'Parfait pour un dîner romantique.',
    'Je suis conquis, tout était parfait.',
  ];

  const placeSlugs = placesData.map(p => p.slug);

  for (const slug of placeSlugs) {
    const place = await prisma.place.findUnique({
      where: { slug },
    });

    if (place) {
      // 2-3 avis par établissement
      const numReviews = Math.floor(Math.random() * 2) + 2;
      for (let i = 0; i < numReviews; i++) {
        const rating = Math.floor(Math.random() * 2) + 4; // 4 ou 5
        const comment = reviewComments[Math.floor(Math.random() * reviewComments.length)];

        await prisma.review.create({
          data: {
            rating,
            comment,
            authorId: user.id,
            placeId: place.id,
            status: 'APPROVED',
          },
        });
      }
      console.log(`✅ Avis créés pour ${place.name}`);
    }
  }

  console.log(`\n🎉 ${createdCount} établissements créés avec succès !`);
  console.log('📸 Images réelles intégrées !');
  console.log('\n🔑 Comptes de test:');
  console.log('  Admin: admin@quivibe.com / admin123');
  console.log('  Owner: owner@quivibe.com / admin123');
  console.log('  User: user@quivibe.com / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
