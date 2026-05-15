"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "worker">("customer");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          password,
          role,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((data as { detail?: string }).detail ?? "Registration failed");
        return;
      }
      toast.success("Account created");
      if (role === "worker") router.push("/worker/profile");
      else router.push("/customer/complete-profile");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="hk-card mx-auto flex max-w-md flex-col gap-4">
      <p className="hk-eyebrow">Get started</p>
      <h1 className="text-3xl font-black tracking-[-0.04em] text-neutral-950">Create account</h1>
      <p className="text-sm leading-6 text-neutral-600">
        Start with your name and phone. You will add city, CNIC (workers), and skills next — Pakistan
        first; add more countries later.
      </p>
      <label className="hk-label">
        Full name
        <input
          className="hk-input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </label>
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
        Password (min 8)
        <input
          type="password"
          className="hk-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </label>
      <fieldset className="text-sm font-bold text-neutral-700">
        <legend className="mb-2">I am a</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <label
            className={`cursor-pointer rounded-2xl border px-4 py-3 transition ${
              role === "customer" ? "border-neutral-950 bg-lime-300" : "border-neutral-950/10 bg-neutral-50"
            }`}
          >
            <input
              type="radio"
              name="role"
              checked={role === "customer"}
              onChange={() => setRole("customer")}
              className="sr-only"
            />{" "}
            Customer (post jobs)
          </label>
          <label
            className={`cursor-pointer rounded-2xl border px-4 py-3 transition ${
              role === "worker" ? "border-neutral-950 bg-lime-300" : "border-neutral-950/10 bg-neutral-50"
            }`}
          >
            <input
              type="radio"
              name="role"
              checked={role === "worker"}
              onChange={() => setRole("worker")}
              className="sr-only"
            />{" "}
            Worker (bid & earn)
          </label>
        </div>
      </fieldset>
      <button
        type="submit"
        disabled={loading}
        className="hk-btn-lime mt-2"
      >
        {loading ? "Creating…" : "Sign up"}
      </button>
    </form>
  );
}
