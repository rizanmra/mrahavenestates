import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPortal } from "./AdminPortal";

export const metadata: Metadata = {
  title: "Staff portal",
  description: "Listings and property enquiries for MRA Haven Estates staff.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="page-offset px-6 py-16 text-center text-[color:var(--muted)]">
          Loading staff portal…
        </div>
      }
    >
      <AdminPortal />
    </Suspense>
  );
}
