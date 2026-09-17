import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  trustHost: true,
  providers: [
    Credentials({
      name: "Credenziali",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminHash = process.env.ADMIN_PASSWORD_HASH;

        if (!adminEmail || !adminHash) {
          console.error(
            "[auth] ADMIN_EMAIL / ADMIN_PASSWORD_HASH non configurate — login admin disabilitato."
          );
          return null;
        }
        if (typeof email !== "string" || typeof password !== "string") return null;
        if (email.trim().toLowerCase() !== adminEmail.trim().toLowerCase()) return null;

        const valid = await bcrypt.compare(password, adminHash);
        if (!valid) return null;

        return { id: "admin", email: adminEmail, name: "Amministratore" };
      },
    }),
  ],
});
