import type { Metadata } from "next";
import { Geist, Geist_Mono, Cinzel } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { WhatsNewOnLaunch } from "@/components/shared/whats-new";
import { UpdateNoticeOnLaunch } from "@/components/shared/update-notice";
import { getLocale } from "@/lib/i18n/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sanctum — DnD Campaign Manager",
  description:
    "A local-first campaign manager for Dungeon Masters: characters, combat, world, story and more.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`dark ${geistSans.variable} ${geistMono.variable} ${cinzel.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <I18nProvider locale={locale}>
          {children}
          <WhatsNewOnLaunch />
          <UpdateNoticeOnLaunch />
        </I18nProvider>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
