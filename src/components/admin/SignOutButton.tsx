"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className="text-sm text-charcoal transition-colors hover:text-ink"
    >
      Esci
    </button>
  );
}
