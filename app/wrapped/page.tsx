import { auth } from "@/auth";
import { WrappedClient } from "@/components/WrappedClient";
import { redirect } from "next/navigation";

export default async function WrappedPage() {
  const session = await auth();
  if (!session?.accessToken || session.error) redirect("/");

  return <WrappedClient />;
}
