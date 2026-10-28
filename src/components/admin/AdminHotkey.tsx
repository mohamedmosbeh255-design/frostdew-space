"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/* Hidden keyboard entry to the admin panel:
 * ⌘+Shift+A (macOS) / Ctrl+Shift+A (Windows & Linux) → /admin.
 * Renders nothing — mounted once inside the public footer so the
 * shortcut is available on every page of the storefront. */

export default function AdminHotkey() {
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "a") return; // case-insensitive "A"
      if (!event.shiftKey) return;
      if (!(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      router.push("/admin");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return null;
}
