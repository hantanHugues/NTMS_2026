"use client";

import * as React from "react";
import { Select } from "@base-ui/react/select";
import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, Search } from "lucide-react";

import { PAYS, paysParCode, type Pays } from "@/lib/inscription-regles";
import { cn } from "@/lib/utils";

/**
 * Listes déroulantes du formulaire.
 *
 * DEUX RENDUS, selon la taille de l'écran :
 *
 *   – Sur TÉLÉPHONE (< 640 px), une liste NATIVE. Le système affiche
 *     alors son propre sélecteur, en bas de l'écran, avec la recherche
 *     et le défilement auxquels la personne est habituée. La version
 *     stylisée s'ouvrait par-dessus le formulaire, souvent au-dessus du
 *     champ, et la liste des pays atteignait 9 800 px de haut.
 *
 *   – Sur ORDINATEUR, la version stylisée (Base UI), qui garde
 *     l'apparence des champs et, pour les pays, la recherche.
 *
 * Les deux écrivent la même valeur : le reste du formulaire ne voit
 * aucune différence.
 */

const DECLENCHEUR =
  "flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left text-base outline-none transition-colors hover:border-primary/40 focus-visible:border-primary data-[popup-open]:border-primary";

const MENU =
  "max-h-[min(20rem,var(--available-height))] overflow-y-auto rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl outline-none origin-[var(--transform-origin)] transition-[opacity,transform] duration-150 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0";

const OPTION =
  "flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm outline-none select-none data-[highlighted]:bg-primary/10 data-[selected]:font-semibold";

/** Le champ natif : hauteur confortable au doigt, flèche dessinée. */
const NATIF =
  "h-13 w-full appearance-none rounded-xl border border-border bg-background px-4 pr-11 text-base outline-none focus:border-primary";

export type Option = { valeur: string; libelle: string };

function Fleche() {
  return (
    <ChevronDown
      aria-hidden
      className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground"
    />
  );
}

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
    <>
      {/* Téléphone : la liste du système. */}
      <div className="relative sm:hidden">
        <select
          aria-labelledby={etiquette}
          className={cn(NATIF, !valeur && "text-muted-foreground/70")}
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{indication}</option>
          {items.map((o) => (
            <option key={o.valeur} value={o.valeur}>
              {o.libelle}
            </option>
          ))}
        </select>
        <Fleche />
      </div>

      {/* Ordinateur : la liste stylisée. */}
      <div className="max-sm:hidden">
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
      </div>
    </>
  );
}

const libellePays = (p: Pays) => `${p.nom} (+${p.indicatif})`;

/**
 * Vrai une fois la page prise en main par le navigateur.
 *
 * Les noms de pays viennent de la table du système (`Intl`), et le
 * serveur ne les écrit pas toujours comme le navigateur : « Bénin » ou
 * « BJ » selon la machine. React refusait alors l'accord entre les deux
 * rendus. La liste n'est donc construite qu'une fois côté navigateur ;
 * avant cela, on n'affiche que l'indicatif, identique partout.
 */
function useMonte() {
  const [monte, setMonte] = React.useState(false);
  React.useEffect(() => setMonte(true), []);
  return monte;
}

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
  const monte = useMonte();
  const courant = paysParCode(valeur);
  return (
    <>
      {/* Téléphone : 245 pays dans la liste du système, avec sa propre
          recherche. Bien plus rapide qu'un panneau de 9 800 px. */}
      <div className="relative sm:hidden">
        <select
          aria-labelledby={etiquette}
          className={NATIF}
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
        >
          {monte ? (
            PAYS.map((p) => (
              <option key={p.code} value={p.code}>
                {libellePays(p)}
              </option>
            ))
          ) : (
            <option value={valeur}>+{courant?.indicatif ?? ""}</option>
          )}
        </select>
        <Fleche />
      </div>

      <div className="max-sm:hidden">
        {!monte ? (
          <div className={cn(DECLENCHEUR, "text-muted-foreground")}>
            +{courant?.indicatif ?? ""}
            <ChevronDown className="size-4" />
          </div>
        ) : (
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
            const nom = pays.nom
              .toLowerCase()
              .normalize("NFD")
              .replace(/[̀-ͯ]/g, "");
            return (
              nom.includes(q) ||
              pays.indicatif.startsWith(q) ||
              pays.code.toLowerCase() === q
            );
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
            <Combobox.Positioner
              sideOffset={6}
              className="z-50 w-[max(var(--anchor-width),16rem)]"
            >
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
        )}
      </div>
    </>
  );
}
