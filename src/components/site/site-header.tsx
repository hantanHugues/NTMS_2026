"use client";

import * as React from "react";
import Image from "next/image";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { event, navItems } from "@/lib/content";

export function SiteHeader() {
  const ref = React.useRef<HTMLElement>(null);

  /**
   * L'en-tête prend trois états, écrits dans `data-tone` :
   *
   *   top     — sommet de page, posé sur le hero sombre : aucun fond.
   *   light   — au-dessus des sections claires : crème translucide.
   *   brique  — au-dessus de la section « preuve » : verre teinté brique.
   *
   * Un seul attribut pour les trois, parce que deux règles `data-*`
   * concurrentes sur `background` ont la même spécificité : c'est
   * l'ordre de génération des utilitaires qui trancherait, et il n'est
   * pas garanti. Les valeurs s'excluent, le conflit n'existe plus.
   *
   * `dark` est posée dès que le fond derrière l'en-tête est sombre —
   * donc en `top` comme en `brique`.
   *
   * L'état est écrit directement sur le nœud : pas de state React, donc
   * aucun rerendu à chaque pixel de défilement.
   */
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frame = 0;
    const apply = () => {
      frame = 0;
      const scrolled = window.scrollY > 40;

      // On teste la section brique au BAS de la barre, pas au haut de la
      // fenêtre : la bascule tombe ainsi au moment ou la brique touche
      // l'en-tête, et non une demi-hauteur plus tard.
      const band = el.offsetHeight;
      const preuve = document.getElementById("preuve");
      const rect = preuve?.getBoundingClientRect();
      const overPreuve = !!rect && rect.top <= band && rect.bottom >= band;

      const tone = !scrolled ? "top" : overPreuve ? "brique" : "light";
      el.dataset.tone = tone;
      el.dataset.compact = String(scrolled);
      el.classList.toggle("dark", tone !== "light");
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header
      ref={ref}
      data-tone="top"
      data-compact="false"
      className="dark group/header fixed inset-x-0 top-0 z-50 border-b border-transparent transition-colors duration-500 data-[tone=light]:border-border/70 data-[tone=light]:bg-background data-[tone=brique]:border-white/10 data-[tone=brique]:bg-[oklch(0.325_0.082_37)]/55 data-[tone=brique]:backdrop-blur-xl"
    >
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-6 px-6 transition-all duration-500 group-data-[compact=true]/header:h-16">
        <a href="#top" className="flex items-center gap-3 text-foreground">
          {/* Le logo est en nuit sur fond transparent. Sur le hero
              l'en-tete porte la classe `dark`, on le passe donc en
              blanc ; une fois defile il reprend sa couleur d'origine. */}
          <Image
            src="/ntms-logo.png"
            alt="NTMS 2026"
            width={1699}
            height={1267}
            priority
            className="h-8 w-auto transition-[filter] duration-500 dark:brightness-0 dark:invert"
          />
          <span className="hidden h-4 w-px bg-current opacity-20 sm:block" />
          <span className="hidden text-xs tracking-wider text-muted-foreground sm:block">
            {event.organisation}
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="relative text-sm font-medium text-muted-foreground transition-colors duration-300 after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all after:duration-300 hover:text-foreground hover:after:w-full"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            nativeButton={false}
            className="hidden h-10 rounded-full px-5 md:inline-flex"
            render={<a href="#inscription" />}
          >
            Je m&apos;inscris
          </Button>

          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="text-foreground md:hidden">
                  <Menu />
                  <span className="sr-only">Ouvrir le menu</span>
                </Button>
              }
            />
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle className="font-heading text-xl">
                  {event.name}
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {navItems.map((item) => (
                  <SheetClose
                    key={item.href}
                    render={
                      <Button
                        nativeButton={false}
                        variant="ghost"
                        className="h-11 justify-start text-base"
                        render={<a href={item.href} />}
                      />
                    }
                  >
                    {item.label}
                  </SheetClose>
                ))}
                <SheetClose
                  render={
                    <Button
                      nativeButton={false}
                      className="mt-4 h-11 rounded-full text-base"
                      render={<a href="#inscription" />}
                    />
                  }
                >
                  Je m&apos;inscris
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
