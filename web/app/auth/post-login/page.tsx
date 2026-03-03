import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAuthenticatedUserById } from "@/lib/auth/users";

export default async function PostLoginPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/auth/signin");
  }

  const user = await getAuthenticatedUserById(userId);
  if (!user) {
    redirect("/auth/signin");
  }

  if (user.hasDiagnosticSnapshot) {
    redirect("/portal");
  }

  redirect("/diagnostico");
}
