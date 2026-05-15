import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { getMeJson } from "@/lib/api-server";

export async function SiteHeader() {
  const me = await getMeJson();
  const role = (me?.role as string | undefined) ?? null;

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-950/10 bg-[#f5f5ef]/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="rounded-full bg-neutral-950 px-3 py-1.5 text-sm font-black tracking-tight text-lime-300">
          HirKaar
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm font-bold text-neutral-700">
          <Link href="/customer/jobs" className="hover:text-neutral-950">
            Jobs
          </Link>
          {role === "customer" && (
            <>
              <Link href="/customer/profile" className="hover:text-neutral-950">
                Profile
              </Link>
              <Link href="/customer/jobs/new" className="hover:text-neutral-950">
                Post job
              </Link>
            </>
          )}
          {role === "worker" && (
            <>
              <Link href="/worker/dashboard" className="hover:text-neutral-950">
                Dashboard
              </Link>
              <Link href="/worker/wallet" className="hover:text-neutral-950">
                Wallet
              </Link>
              <Link href="/worker/profile" className="hover:text-neutral-950">
                Profile
              </Link>
            </>
          )}
          {role === "admin" && (
            <Link href="/admin" className="hover:text-neutral-950">
              Admin
            </Link>
          )}
          {me ? (
            <SignOutButton />
          ) : (
            <>
              <Link href="/login" className="hover:text-neutral-950">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-lime-300 px-4 py-2 text-neutral-950 shadow-sm hover:bg-lime-200"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
