"use client";

import * as React from "react";
import { Select } from "@base-ui/react/select";
import { Combobox } from "@base-ui/react/combobox";
import { Drawer } from "@base-ui/react/drawer";
import { Check, ChevronDown, Search, X } from "lucide-react";

import { PAYS, paysParCode, type Pays } from "@/lib/inscription-regles";
import { cn } from "@/lib/utils";

/**
 * Les listes du formulaire, aux couleurs du site, dans les deux usages :
 *
 *   – Sur ORDINATEUR, le menu s'ouvre sous le champ (Select, et Combobox
 *     avec recherche pour les pays).
 *
 *   – Sur TÉLÉPHONE, une FEUILLE monte du bas de l'écran, comme dans les
 *     applications : poignée, titre, glissement vers le bas pour fermer,
 *     grandes lignes sous le pouce. Le menu flottant, lui, s'ouvrait
 *     au-dessus du champ, au milieu du formulaire, et la liste des pays
 *     dépassait la hauteur de l'écran.
 *
 * Les deux écrivent la même valeur : le reste du formulaire ne voit
 * aucune différence.
 */

const DECLENCHEUR =
  "flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left text-base outline-none transition-colors hover:border-primary/40 focus-visible:border-primary data-[popup-open]:border-primary max-sm:min-h-13";

const MENU =
  "max-h-[min(20rem,var(--available-height))] overflow-y-auto rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl outline-none origin-[var(--transform-origin)] transition-[opacity,transform] duration-150 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0";

const OPTION =
  "flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm outline-none select-none data-[highlighted]:bg-primary/10 data-[selected]:font-semibold";

/* ------------------------------------------------------------------ */
/* La feuille du bas, sur téléphone                                     */
/* ------------------------------------------------------------------ */

/** Le voile : la page s'assombrit derrière, et se ré-éclaire au glissement. */
const VOILE =
  "fixed inset-0 z-50 bg-nuit/50 opacity-[calc(1-var(--drawer-swipe-progress))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-[swiping]:duration-0 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0";

const VUE = "fixed inset-0 z-50 flex items-end justify-center";

/**
 * La feuille. Le `-mb-12 pb-12` déborde sous l'écran : si le doigt tire
 * un peu trop, on ne voit pas le fond de page apparaître dessous.
 */
const FEUILLE =
  "relative -mb-12 flex w-full flex-col overflow-hidden rounded-t-3xl border-t border-border bg-card pb-12 text-card-foreground shadow-2xl outline-none [transform:translateY(var(--drawer-swipe-movement-y))] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-[swiping]:select-none data-[starting-style]:[transform:translateY(calc(100%-3rem+2px))] data-[ending-style]:[transform:translateY(calc(100%-3rem+2px))] data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)]";

/** Une ligne de la feuille : haute, pleine largeur, coche à droite. */
function Rangee({
  choisi,
  onClick,
  children,
}: {
  choisi: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={choisi}
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left text-base transition-colors active:bg-primary/10",
        choisi ? "bg-primary/10 font-semibold" : "hover:bg-primary/5"
      )}
    >
      {children}
      <Check
        className={cn(
          "size-5 shrink-0 text-primary",
          choisi ? "opacity-100" : "opacity-0"
        )}
      />
    </button>
  );
}

function Feuille({
  titre,
  ouvert,
  onOuvert,
  etiquetteDeclencheur,
  apercu,
  vide,
  haute,
  entete,
  children,
}: {
  titre: string;
  ouvert: boolean;
  onOuvert: (v: boolean) => void;
  etiquetteDeclencheur: string;
  /** ce qu'affiche le champ fermé */
  apercu: React.ReactNode;
  /** vrai quand rien n'est encore choisi : texte grisé */
  vide: boolean;
  /** feuille haute (liste longue avec recherche) */
  haute?: boolean;
  /** barre fixée sous le titre (la recherche, par exemple) */
  entete?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Drawer.Root open={ouvert} onOpenChange={onOuvert} swipeDirection="down">
      <Drawer.Trigger
        aria-labelledby={etiquetteDeclencheur}
        className={DECLENCHEUR}
      >
        <span className={cn("truncate", vide && "text-muted-foreground/70")}>
          {apercu}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className={VOILE} />
        <Drawer.Viewport className={VUE}>
          <Drawer.Popup
            className={cn(
              FEUILLE,
              haute
                ? "h-[calc(85svh+3rem)] max-h-[calc(85svh+3rem)]"
                : "max-h-[calc(80svh+3rem)]"
            )}
          >
            <Drawer.SwipeArea className="shrink-0 px-5 pt-3 pb-1">
              <div
                aria-hidden
                className="mx-auto h-1.5 w-10 rounded-full bg-border"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <Drawer.Title className="font-heading text-lg font-extrabold tracking-tight">
                  {titre}
                </Drawer.Title>
                <Drawer.Close
                  aria-label="Fermer"
                  className="-mr-2 flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors active:bg-primary/10"
                >
                  <X className="size-5" />
                </Drawer.Close>
              </div>
            </Drawer.SwipeArea>
            {entete ? <div className="shrink-0 px-5 pb-2">{entete}</div> : null}
            <div
              role="listbox"
              aria-label={titre}
              className="min-h-0 flex-1 touch-auto overflow-y-auto overscroll-contain px-2 pt-1 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            >
              {children}
            </div>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

/* ------------------------------------------------------------------ */

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
  const [ouvert, setOuvert] = React.useState(false);

  return (
    <>
      {/* Téléphone : la feuille du bas. */}
      <div className="sm:hidden">
        <Feuille
          titre={indication}
          ouvert={ouvert}
          onOuvert={setOuvert}
          etiquetteDeclencheur={etiquette}
          apercu={choisi ? choisi.libelle : indication}
          vide={!choisi}
        >
          {items.map((o) => (
            <Rangee
              key={o.valeur}
              choisi={o.valeur === valeur}
              onClick={() => {
                onChange(o.valeur);
                setOuvert(false);
              }}
            >
              <span className="min-w-0">{o.libelle}</span>
            </Rangee>
          ))}
        </Feuille>
      </div>

      {/* Ordinateur : le menu sous le champ. */}
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

const sansAccent = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

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
  const [ouvert, setOuvert] = React.useState(false);
  const [requete, setRequete] = React.useState("");

  const filtrer = React.useCallback((p: Pays, brut: string) => {
    const q = sansAccent(brut).replace(/^\+/, "").trim();
    if (!q) return true;
    return (
      sansAccent(p.nom).includes(q) ||
      p.indicatif.startsWith(q) ||
      p.code.toLowerCase() === q
    );
  }, []);

  const listeFiltree = React.useMemo(
    () => PAYS.filter((p) => filtrer(p, requete)),
    [filtrer, requete]
  );

  return (
    <>
      {/* Téléphone : la feuille du bas, avec sa recherche. Le champ
          fermé n'affiche que l'indicatif : c'est ce qui compte à côté
          du numéro, et la place est comptée. */}
      <div className="sm:hidden">
        <Feuille
          titre="Pays du numéro"
          ouvert={ouvert}
          onOuvert={(v) => {
            setOuvert(v);
            if (!v) setRequete("");
          }}
          etiquetteDeclencheur={etiquette}
          apercu={`+${courant?.indicatif ?? ""}`}
          vide={!courant}
          haute
          entete={
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                inputMode="search"
                autoComplete="off"
                aria-label="Rechercher un pays"
                placeholder="Pays ou indicatif"
                value={requete}
                onChange={(e) => setRequete(e.target.value)}
                className="h-12 w-full rounded-xl border border-border bg-background pr-4 pl-10 text-base outline-none placeholder:text-muted-foreground/60 focus:border-primary"
              />
            </div>
          }
        >
          {monte && listeFiltree.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Aucun pays ne correspond.
            </p>
          ) : null}
          {monte
            ? listeFiltree.map((p) => (
                <Rangee
                  key={p.code}
                  choisi={p.code === valeur}
                  onClick={() => {
                    onChange(p.code);
                    setRequete("");
                    setOuvert(false);
                  }}
                >
                  <span className="min-w-0 flex-1 truncate">{p.nom}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    +{p.indicatif}
                  </span>
                </Rangee>
              ))
            : null}
        </Feuille>
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
            filter={(p, brut) => filtrer(p as Pays, brut)}
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
