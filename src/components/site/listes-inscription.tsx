"use client";

import * as React from "react";
import { Select } from "@base-ui/react/select";
import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, Search } from "lucide-react";

import { PAYS, paysParCode, type Pays } from "@/lib/inscription-regles";
import { cn } from "@/lib/utils";

/**
 * Listes déroulantes du formulaire, construites sur Base UI : clavier,
 * lecteurs d'écran et placement du menu sont gérés par la bibliothèque ;
 * l'apparence suit les champs du formulaire (arrondis, bordure qui
 * passe au bleu au focus, menu en carte).
 */

const DECLENCHEUR =
  "flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left text-base outline-none transition-colors hover:border-primary/40 focus-visible:border-primary data-[popup-open]:border-primary";

const MENU =
  "max-h-[min(20rem,var(--available-height))] overflow-y-auto rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl outline-none origin-[var(--transform-origin)] transition-[opacity,transform] duration-150 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0";

const OPTION =
  "flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm outline-none select-none data-[highlighted]:bg-primary/10 data-[selected]:font-semibold";

export type Option = { valeur: string; libelle: string };

export function ListeDeroulante({
  options,
  valeur,
  onChange,
  etiquette,
  indication = "Choisir…",
}: {
  options: readonly Option[] | readonly string[];
  valeur: string;
  onChange: (v: string) => void;
  /** id du libellé qui nomme la liste */
  etiquette: string;
  indication?: string;
}) {
  const items: Option[] = options.map((o) =>
    typeof o === "string" ? { valeur: o, libelle: o } : o
  );
  const choisi = items.find((o) => o.valeur === valeur);

  return (
    <Select.Root
      value={valeur || null}
      onValueChange={(v) => onChange((v as string | null) ?? "")}
    >
      <Select.Trigger aria-labelledby={etiquette} className={DECLENCHEUR}>
        <span className={cn("truncate", !choisi && "text-muted-foreground/70")}>
          {choisi ? choisi.libelle : indication}
        </span>
        <Select.Icon className="shrink-0 text-muted-foreground">
          <ChevronDown className="size-4" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          sideOffset={6}
          alignItemWithTrigger={false}
          className="z-50 w-[var(--anchor-width)]"
        >
          <Select.Popup className={MENU}>
            {items.map((o) => (
              <Select.Item key={o.valeur} value={o.valeur} className={OPTION}>
                <Select.ItemText>{o.libelle}</Select.ItemText>
                <Select.ItemIndicator className="shrink-0 text-primary">
                  <Check className="size-4" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

const libellePays = (p: Pays) => `${p.nom} (+${p.indicatif})`;

/** Choix du pays du numéro, avec recherche par nom ou par indicatif. */
export function ChoixPays({
  valeur,
  onChange,
  etiquette,
}: {
  valeur: string;
  onChange: (code: string) => void;
  etiquette: string;
}) {
  return (
    <Combobox.Root
      items={PAYS}
      value={paysParCode(valeur) ?? null}
      onValueChange={(p) => {
        if (p) onChange((p as Pays).code);
      }}
      itemToStringLabel={(p) => libellePays(p as Pays)}
      isItemEqualToValue={(a, b) => (a as Pays).code === (b as Pays).code}
      filter={(p, requete) => {
        const q = requete
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .replace(/^\+/, "")
          .trim();
        if (!q) return true;
        const pays = p as Pays;
        const nom = pays.nom.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
        return nom.includes(q) || pays.indicatif.startsWith(q) || pays.code.toLowerCase() === q;
      }}
      autoHighlight
    >
      <div className="relative">
        <Combobox.Input
          aria-labelledby={etiquette}
          className={cn(DECLENCHEUR, "pr-10")}
          onFocus={(e) => e.currentTarget.select()}
        />
        <Combobox.Trigger
          aria-label="Ouvrir la liste des pays"
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground"
        >
          <ChevronDown className="size-4" />
        </Combobox.Trigger>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={6} className="z-50 w-[max(var(--anchor-width),16rem)]">
          <Combobox.Popup className={MENU}>
            <Combobox.Empty className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground empty:hidden">
              <Search className="size-4" />
              Aucun pays ne correspond.
            </Combobox.Empty>
            <Combobox.List>
              {(p: Pays) => (
                <Combobox.Item key={p.code} value={p} className={OPTION}>
                  <span className="truncate">{p.nom}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    +{p.indicatif}
                  </span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
