import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { cookies, headers } from "next/headers";
import LocaleProvider from "@/components/LocaleProvider";
import { detectLocale, langCookieName, messages } from "@/lib/i18n";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export async function generateMetadata(): Promise<Metadata> {
  const jar = await cookies();
  const hdrs = await headers();
  const locale = detectLocale(jar.get(langCookieName())?.value, hdrs.get("accept-language"));
  const t = messages[locale];
  return {
    title: t.metaTitle,
    description: t.metaDesc,
    icons: { icon: "/logo.png", apple: "/logo.png" },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const jar = await cookies();
  const hdrs = await headers();
  const locale = detectLocale(jar.get(langCookieName())?.value, hdrs.get("accept-language"));

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LocaleProvider initial={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
