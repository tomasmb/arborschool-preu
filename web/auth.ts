import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { upsertUserFromGoogleProfile } from "@/lib/auth/users";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        return false;
      }

      const dbUser = await upsertUserFromGoogleProfile({
        email: user.email,
        name: user.name ?? null,
      });

      user.id = dbUser.id;
      user.email = dbUser.email;
      user.name =
        [dbUser.firstName, dbUser.lastName].filter(Boolean).join(" ") || null;

      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
      }

      if (user?.email) {
        token.email = user.email;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.userId === "string") {
        session.user.id = token.userId;
      }

      return session;
    },
  },
});
