import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

interface SignInPageProps {
  searchParams?: Promise<{
    callbackUrl?: string;
  }>;
}

function resolveSafeCallbackUrl(callbackUrl: string | undefined): string {
  if (!callbackUrl || !callbackUrl.startsWith("/")) {
    return "/auth/post-login";
  }
  return callbackUrl;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/auth/post-login");
  }

  const params = await searchParams;
  const callbackUrl = resolveSafeCallbackUrl(params?.callbackUrl);

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-serif font-bold text-primary mb-2">
          Iniciar sesión
        </h1>
        <p className="text-sm text-gray-600 mb-8">
          Usa Google para acceder a tu portal de aprendizaje.
        </p>

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
