"use client";

import { useEffect, useState } from "react";
import { ExternalLink, LogOut, Menu, Snowflake, X, Package, Tags, Share2, Video, Sparkles, ScrollText } from "lucide-react";
import { ADMIN_CONFIG, BRAND_CONFIG } from "@/config/store";
import { useStoreData } from "@/lib/store";
import SnowfallLayer from "@/components/winter/SnowfallLayer";
import AdminLogin from "./AdminLogin";
import ProductManager from "./ProductManager";
import {
  BrandManager,
  CategoriesManager,
  HeroManager,
  IntroductionManager,
  SocialManager,
} from "./managers";

/* Admin dashboard — the keeper's private CMS (spec §49).
 * Hidden route (/admin), localStorage auth token, winter design system
 * with reduced snowfall. Not linked from public navigation. */

type SectionId = "products" | "categories" | "social" | "hero" | "brand" | "introduction";

const SECTIONS: { id: SectionId; label: string; icon: typeof Package }[] = [
  { id: "products", label: "Products", icon: Package },
  { id: "categories", label: "Categories", icon: Tags },
  { id: "social", label: "Social Links", icon: Share2 },
  { id: "hero", label: "Hero Video", icon: Video },
  { id: "brand", label: "Brand", icon: Sparkles },
  { id: "introduction", label: "Introduction", icon: ScrollText },
];

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ADMIN_CONFIG.tokenKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email?: string };
    return parsed?.email?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

export default function AdminApp() {
  const { data, update } = useStoreData();
  const [email, setEmail] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [section, setSection] = useState<SectionId>("products");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Read the localStorage token after mount (SSR-safe, async to avoid
    // synchronous setState within the effect body).
    const token = readToken();
    const t = setTimeout(() => {
      setEmail(token);
      setChecked(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const login = (loggedInEmail: string) => {
    window.localStorage.setItem(
      ADMIN_CONFIG.tokenKey,
      JSON.stringify({ email: loggedInEmail, loginAt: Date.now() }),
    );
    setEmail(loggedInEmail);
  };

  const logout = () => {
    window.localStorage.removeItem(ADMIN_CONFIG.tokenKey);
    setEmail(null);
  };

  if (!checked) {
    return <div className="min-h-screen" aria-hidden="true" />;
  }

  if (!email) {
    return <AdminLogin onLogin={login} />;
  }

  const sidebar = (
    <nav aria-label="Admin sections" className="flex h-full flex-col gap-1.5 p-4">
      {SECTIONS.map(({ id, label, icon: Icon }) => {
        const active = section === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              setSection(id);
              setSidebarOpen(false);
            }}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition-all duration-300 ${
              active
                ? "bg-gradient-to-r from-winter to-midnight text-snow shadow-lg shadow-winter/25"
                : "text-winter hover:bg-white/70"
            }`}
          >
            <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="relative flex min-h-screen flex-col">
      <SnowfallLayer density={0.3} />

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/55 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open admin menu"
              aria-controls="admin-sidebar"
              className="glass-chip flex h-10 w-10 items-center justify-center rounded-xl text-winter lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="flex items-center gap-2 font-display text-lg tracking-[0.16em] text-midnight">
              <Snowflake className="h-5 w-5 text-glacier" aria-hidden="true" />
              {data.brandConfig.brandName || BRAND_CONFIG.brandName}
              <span className="hidden rounded-full bg-secondary px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-winter sm:inline">
                Keeper&rsquo;s Cabin
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <a
              href="/"
              className="glass-chip flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-winter transition-all duration-300 hover:-translate-y-0.5"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">View Site</span>
            </a>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-b from-winter to-midnight px-4 py-2.5 text-sm font-bold text-snow shadow-lg shadow-winter/25 transition-all duration-300 hover:-translate-y-0.5"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-6">
        {/* Desktop sidebar */}
        <aside className="glass sticky top-20 hidden h-fit w-60 shrink-0 rounded-[1.5rem] lg:block">
          {sidebar}
        </aside>

        {/* Mobile / tablet sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
            <button
              type="button"
              aria-label="Close admin menu"
              className="absolute inset-0 cursor-default bg-midnight/25 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div id="admin-sidebar" className="glass-deep absolute inset-y-0 left-0 w-72 rounded-r-[1.75rem] py-4">
              <div className="mb-3 flex items-center justify-between px-5">
                <span className="font-display text-base tracking-[0.16em] text-midnight">Sections</span>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close admin menu"
                  className="glass-chip flex h-9 w-9 items-center justify-center rounded-xl text-winter"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              {sidebar}
            </div>
          </div>
        )}

        {/* Content */}
        <main className="min-w-0 flex-1">
          {section === "products" && (
            <ProductManager
              products={data.products}
              categories={data.categories}
              videos={data.videos}
              update={update}
            />
          )}
          {section === "categories" && (
            <CategoriesManager categories={data.categories} products={data.products} update={update} />
          )}
          {section === "social" && (
            <SocialManager socialLinks={data.socialLinks} videos={data.videos} update={update} />
          )}
          {section === "hero" && <HeroManager heroConfig={data.heroConfig} update={update} />}
          {section === "brand" && <BrandManager brandConfig={data.brandConfig} update={update} />}
          {section === "introduction" && (
            <IntroductionManager introductionConfig={data.introductionConfig} update={update} />
          )}
        </main>
      </div>
    </div>
  );
}
