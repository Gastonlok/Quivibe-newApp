import { redirect } from "next/navigation";

export default function OwnerLoginPage() {
  redirect("/login?callbackUrl=/owner/dashboard");
}
