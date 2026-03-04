import { auth } from "@/auth";
import { getAuthenticatedUserById } from "@/lib/auth/users";

export async function getAuthenticatedStudentUserId(): Promise<string | null> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const user = await getAuthenticatedUserById(userId);
  if (!user) {
    return null;
  }

  return user.id;
}
