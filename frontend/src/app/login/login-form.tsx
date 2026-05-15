"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { authFailureToastMessage } from "@/lib/auth-error-message";

export function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") ?? "";
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        toast.error(authFailureToastMessage(data));
        return;
      }
      const user = (data as { user?: { role?: string } }).user;
      toast.success("Welcome back");
      const role = user?.role;
      if (next) {
        router.push(next);
        router.refresh();
        return;
      }
      if (role === "admin") router.push("/admin");
      else if (role === "worker") router.push("/worker/dashboard");
      else router.push("/customer/jobs");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="hk-card mx-auto flex max-w-md flex-col gap-4">
      <p className="hk-eyebrow">Welcome back</p>
      <h1 className="text-3xl font-black tracking-[-0.04em] text-neutral-950">Log in</h1>
      <p className="text-sm leading-6 text-neutral-600">Continue to post jobs, send offers, and track work live.</p>
      <label className="hk-label">
        Phone (digits)
        <input
          className="hk-input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          autoComplete="tel"
        />
      </label>
      <label className="hk-label">
        Password
        <input
          type="password"
          className="hk-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="hk-btn-lime mt-2"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
