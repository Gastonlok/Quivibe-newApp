import { SubscriptionAction } from "@/features/newsletter/components/subscription-action";
export const metadata = {
  title: "Confirmer mon inscription — Quivibe",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return (
    <SubscriptionAction
      token={typeof params.token === "string" ? params.token : ""}
      mode="confirm"
    />
  );
}
