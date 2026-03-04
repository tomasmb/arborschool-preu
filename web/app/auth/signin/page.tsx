import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { resolveSafeCallbackUrl } from "@/lib/auth/callbackUrl";

interface SignInPageProps {
  searchParams?: Promise<{
    callbackUrl?: string;
  }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const callbackUrl = resolveSafeCallbackUrl(params?.callbackUrl);
  const session = await auth();
  if (session?.user?.id) {
    redirect(callbackUrl);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream via-white to-off-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-8 space-y-5">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide font-semibold text-primary">
            Portal estudiante
          </p>
          <h1 className="text-3xl font-serif font-bold text-primary leading-tight">
            Entra para activar tu plan a la carrera que quieres
          </h1>
          <p className="text-sm text-gray-600">
            Tus avances y respuestas se guardan para personalizar cada siguiente
            sprint.
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: callbackUrl });
          }}
        >
          <button
            type="submit"
            className="w-full h-11 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
          >
            Continuar con Google
          </button>
        </form>
      </div>
    </main>
  );
}
