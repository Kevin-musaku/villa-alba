"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(false);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError(true);
      setSubmitting(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm border border-mist bg-paper p-8"
      >
        <h1 className="text-center font-serif text-2xl text-ink">Villa Alba</h1>
        <p className="mt-1 text-center text-xs uppercase tracking-[0.2em] text-stone">
          Pannello Amministratore
        </p>

        <div className="mt-8 space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-[0.12em] text-stone">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full border border-mist bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.12em] text-stone">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full border border-mist bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-charcoal">Credenziali non valide. Riprova.</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-8 w-full border border-ink bg-ink px-6 py-3 text-xs uppercase tracking-[0.2em] text-paper transition-colors hover:bg-charcoal disabled:opacity-50"
        >
          {submitting ? "Accesso in corso..." : "Accedi"}
        </button>
      </form>
    </div>
  );
}
