"use client";

import { useRouter } from "next/navigation";

import { authApi } from "@/lib/api-browser";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="rounded-full border border-neutral-950/20 px-3 py-1.5 text-xs font-black text-neutral-700 hover:bg-white/60"
      onClick={async () => {
        await fetch(authApi("/logout"), { method: "POST" });
        router.push("/");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
