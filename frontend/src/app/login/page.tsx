import { Suspense } from "react";

import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <div className="hk-page-narrow">
      <Suspense fallback={<p className="text-center text-neutral-500">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
