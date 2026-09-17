import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth/auth.config";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/admin/SignOutButton";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/immagini", label: "Immagini" },
  { href: "/admin/vini", label: "Vini" },
  { href: "/admin/attivita", label: "Attività" },
  { href: "/admin/calendario", label: "Calendario Prezzi" },
  { href: "/admin/prenotazioni", label: "Prenotazioni" },
];

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r border-mist bg-paper px-6 py-8">
        <p className="font-serif text-lg text-ink">Villa Alba</p>
        <p className="text-xs uppercase tracking-[0.15em] text-stone">Admin</p>

        <nav className="mt-10 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 text-sm text-charcoal transition-colors hover:bg-fog hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-10 border-t border-mist pt-6">
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 px-8 py-10">
        {!isSupabaseConfigured() && (
          <div className="mb-8 border border-ink/20 bg-fog px-5 py-4 text-sm text-charcoal">
            <p className="font-medium text-ink">Database non ancora collegato</p>
            <p className="mt-1">
              Supabase non è configurato: nulla di ciò che modifichi qui (immagini, vini, prezzi)
              viene salvato in modo permanente — al ricaricamento tornerà tutto come prima. Segui{" "}
              <code className="bg-mist px-1">docs/SETUP.md</code> per creare il progetto Supabase e
              collegarlo tramite le variabili d&apos;ambiente.
            </p>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
