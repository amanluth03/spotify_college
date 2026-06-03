import { auth } from "@/auth";
import { AppHeader } from "@/components/AppHeader";
import { DashboardClient } from "@/components/DashboardClient";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.accessToken || session.error) redirect("/");

  return (
    <>
      <AppHeader />
      <DashboardClient />
    </>
  );
}
