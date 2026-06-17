"use client";

import { usePathname } from "next/navigation";
import { NAV_LINKS } from "../lib/nav";

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Navegación principal">
      <ul className="flex items-center gap-5 sm:gap-8 h-12 text-sm font-bold uppercase tracking-wide text-ink-700 overflow-x-auto whitespace-nowrap sm:justify-center sm:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {NAV_LINKS.map((link) => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <li key={link.href} className="relative group h-full flex items-center flex-shrink-0">
              <a
                href={link.href}
                aria-current={active ? "page" : undefined}
                className="hover:text-honduras-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-honduras-blue focus-visible:rounded-sm transition-colors"
              >
                {link.label}
              </a>
              <span
                className={`absolute left-3.5 right-3.5 bottom-2.5 h-0.5 bg-honduras-red transition-all duration-300 ${
                  active ? "w-[calc(100%-1.75rem)]" : "w-0 group-hover:w-[calc(100%-1.75rem)]"
                }`}
              />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
