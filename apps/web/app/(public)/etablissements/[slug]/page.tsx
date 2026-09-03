import { redirect } from "next/navigation";

export default async function LegacyPlacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/places/${slug}`);
}
