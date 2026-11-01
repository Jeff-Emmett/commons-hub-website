"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { EditAttr } from "@/lib/directus/editAttr";

// Site-wide content the client components need (header, footer, social side
// bar): Directus Settings → Site settings and the "Footer (every page)" page.
// Loaded once in the root layout and handed down here, because SiteFooter and
// the header are client components rendered inside other client components.

export interface ChromeLink {
  id: number;
  label: string;
  href: string;
  editAttr?: EditAttr;
}

export interface ChromeColumn {
  heading: string;
  links: ChromeLink[];
  editAttr?: EditAttr;
}

export interface SiteChrome {
  site_name: string;
  contact_email: string;
  address: string[];
  telegram_url: string | null;
  x_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  footer: {
    title: string;
    tagline: string;
    location: string;
    columns: ChromeColumn[];
    brandEdit?: EditAttr;
    bottomEdit?: EditAttr;
  };
}

const EMPTY: SiteChrome = {
  site_name: "Commons Hub",
  contact_email: "",
  address: [],
  telegram_url: null,
  x_url: null,
  instagram_url: null,
  youtube_url: null,
  footer: { title: "Commons Hub", tagline: "", location: "", columns: [] },
};

const Ctx = createContext<SiteChrome>(EMPTY);

export function SiteChromeProvider({ value, children }: { value: SiteChrome; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSite(): SiteChrome {
  return useContext(Ctx);
}
