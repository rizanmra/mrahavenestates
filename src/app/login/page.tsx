import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginPortal } from "./LoginPortal";

export const metadata: Metadata = {
  title: "Login",
  description: "Login or register for the MRA Haven Estates client portal.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-36 px-6 text-center text-[color:var(--muted)]">
          Loading portal…
        </div>
      }
    >
      <LoginPortal />
    </Suspense>
  );
}
