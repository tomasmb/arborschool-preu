import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAuthenticatedUserById } from "@/lib/auth/users";

export default async function PostLoginPage() {
  const isStudentPortalEnabled = process.env.STUDENT_PORTAL_V1 !== "false";
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/auth/signin");
  }

  const user = await getAuthenticatedUserById(userId);
  if (!user) {
    redirect("/auth/signin");
  }

  if (isStudentPortalEnabled && user.hasDiagnosticSnapshot) {
    redirect("/portal");
  }

  redirect("/diagnostico");
}
