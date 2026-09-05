import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MessageInbox } from "@/features/admin/message-inbox";
export const dynamic = "force-dynamic";
export default async function MessagesPage() {
  if (!(await auth())?.user?.id) redirect("/login?callbackUrl=/messages");
  return <MessageInbox />;
}
