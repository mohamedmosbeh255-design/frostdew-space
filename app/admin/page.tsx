import type { Metadata } from "next";
import AdminApp from "@/components/admin/AdminApp";

export const metadata: Metadata = {
  title: "Keeper's Cabin — FrostDew Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminApp />;
}
