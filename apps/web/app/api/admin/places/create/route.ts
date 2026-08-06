// apps/web/app/api/admin/places/create/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      address,
      neighborhood,
      latitude,
      longitude,
      priceRange,
      phone,
      ownerId,
      status = "APPROVED",
    } = body;

    // Validation
    if (!name || !address || !neighborhood) {
      return NextResponse.json(
        { error: "Le nom, l'adresse et le quartier sont requis" },
        { status: 400 }
      );
    }

    // Créer le slug
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Vérifier si le slug existe déjà
    const existingPlace = await prisma.place.findUnique({
      where: { slug },
    });

    if (existingPlace) {
      // Si le slug existe, ajouter un timestamp
      const timestamp = Date.now().toString().slice(-6);
      slug = `${slug}-${timestamp}`;
    }

    // Déterminer le propriétaire
    let ownerIdToUse = ownerId;
    if (!ownerIdToUse) {
      // Si aucun propriétaire n'est spécifié, utiliser l'admin
      const adminUser = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      ownerIdToUse = adminUser?.id || session.user.id;
    }

    const place = await prisma.place.create({
      data: {
        name,
        slug,
        description: description || "",
        address,
        neighborhood,
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
        priceRange: parseInt(priceRange) || 2,
        phone: phone || null,
        status,
        ownerId: ownerIdToUse,
      },
    });

    return NextResponse.json({ place }, { status: 201 });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
