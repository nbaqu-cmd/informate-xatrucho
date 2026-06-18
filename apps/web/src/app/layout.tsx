import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { TickerBar } from "../components/TickerBar";
import { Nav } from "../components/Nav";
import { NAV_LINKS } from "../lib/nav";
import { api } from "../lib/api";
import { SITE_URL } from "../lib/seo";

const headline = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-headline",
  display: "swap",
});

const article = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-article",
  display: "swap",
});

const body = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Infórmate Xatruch — Transparencia Legislativa Honduras",
    template: "%s — Infórmate Xatruch",
  },
  description:
    "Análisis automático e imparcial de las leyes hondureñas. Sin sesgos, solo la verdad.",
  openGraph: {
    siteName: "Infórmate Xatruch",
    title: "Infórmate Xatruch",
    description: "Transparencia legislativa para el pueblo hondureño",
    locale: "es_HN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Infórmate Xatruch",
    description: "Transparencia legislativa para el pueblo hondureño",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let tickerItems: { id: string; label: string }[] = [];
  try {
    const { laws } = await api.laws.list({ page: 1 });
    tickerItems = laws.slice(0, 8).map((l) => ({
      id: l.id,
      label: `Decreto ${l.lawNumber} — ${l.title}`,
    }));
  } catch {
    tickerItems = [];
  }

  const today = new Date().toLocaleDateString("es-HN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <html lang="es" className={`${headline.variable} ${article.variable} ${body.variable} scroll-smooth`}>
      <body className="bg-paper text-ink min-h-screen font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-ink focus:text-paper focus:px-4 focus:py-2 focus:text-sm focus:font-bold"
        >
          Saltar al contenido principal
        </a>
        <TickerBar items={tickerItems} />

        <header className="bg-paper-50 sticky top-0 z-40 border-b border-border backdrop-blur supports-[backdrop-filter]:bg-paper-50/90">
          {/* Masthead */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 text-center">
            <div className="hidden sm:flex items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-500">
              <DotTrio color="bg-honduras-blue" />
              Transparencia Legislativa Automatizada · Honduras
              <DotTrio color="bg-honduras-red" />
            </div>
            <a href="/" className="block">
              <h1 className="font-serif font-black text-4xl sm:text-6xl tracking-tight text-ink leading-none mt-2">
                Infórmate <span className="italic">Xatruch</span>
              </h1>
            </a>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-1.5 text-xs text-ink-500 font-medium">
              <span>Tegucigalpa, M.D.C.</span>
              <span className="text-border hidden sm:inline">|</span>
              <span className="capitalize">{today}</span>
              <span className="text-border hidden sm:inline">|</span>
              <span className="text-honduras-blue font-bold">Edición continua</span>
            </div>
          </div>

          <div className="rule-double" />

          <Nav />
        </header>

        <main id="main-content">{children}</main>

        <footer className="bg-ink text-[#C4C1B7] mt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 sm:grid-cols-3 gap-10">
            <div>
              <h2 className="font-serif font-black text-2xl text-paper">
                Infórmate <span className="italic">Xatruch</span>
              </h2>
              <p className="text-sm leading-relaxed mt-3 max-w-xs text-[#8E8B81]">
                Plataforma automatizada de transparencia legislativa. Explicamos, sin sesgo, cada
                decreto que publica el Congreso de Honduras a partir de su texto oficial.
              </p>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#6E6B61] mb-4">
                Secciones
              </div>
              <div className="flex flex-col gap-2.5 text-sm">
                {NAV_LINKS.map((link) => (
                  <a key={link.href} href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#6E6B61] mb-4">
                Metodología
              </div>
              <p className="text-sm leading-relaxed text-[#8E8B81]">
                Cada análisis se genera por inteligencia artificial a partir del texto oficial del
                decreto. Es útil pero falible y no sustituye asesoría legal.
              </p>
              <a href="/metodologia" className="inline-block mt-3 text-sm font-bold text-white hover:underline">
                Cómo trabajamos y qué verificamos →
              </a>
            </div>
          </div>
          <div className="border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-xs text-[#6E6B61] flex justify-between flex-wrap gap-2">
              <span>© {new Date().getFullYear()} Infórmate Xatruch · Contenido generado por IA a partir del texto oficial de La Gaceta.</span>
              <span>No representa a ningún partido ni institución del Estado.</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

function DotTrio({ color }: { color: string }) {
  return (
    <span className="flex gap-0.5">
      <span className={`w-1.5 h-1.5 ${color}`} />
      <span className={`w-1.5 h-1.5 ${color}`} />
      <span className={`w-1.5 h-1.5 ${color}`} />
    </span>
  );
}
