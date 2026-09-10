"use client";

import * as React from "react";

import {
  HTMLMotionProps,
  MotionValue,
  Variants,
  motion,
  useScroll,
  useTransform,
} from "motion/react";

import { cn } from "@/lib/utils";

interface ContainerScrollContextValue {
  scrollYProgress: MotionValue<number>;
}

const SPRING_CONFIG = {
  type: "spring",
  stiffness: 100,
  damping: 16,
  mass: 0.75,
  restDelta: 0.005,
  duration: 0.3,
} as const;

const blurVariants: Variants = {
  hidden: {
    filter: "blur(10px)",
    opacity: 0,
  },
  visible: {
    filter: "blur(0px)",
    opacity: 1,
  },
};

const ContainerScrollContext = React.createContext<
  ContainerScrollContextValue | undefined
>(undefined);

function useContainerScrollContext() {
  const context = React.useContext(ContainerScrollContext);
  if (!context) {
    throw new Error(
      "useContainerScrollContext must be used within a ContainerScroll Component"
    );
  }
  return context;
}

export const ContainerScroll = ({
  children,
  className,
  style,
  ...props
}: React.HtmlHTMLAttributes<HTMLDivElement>) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
  });
  return (
    <ContainerScrollContext.Provider value={{ scrollYProgress }}>
      <div
        ref={scrollRef}
        className={cn("relative min-h-[120vh]", className)}
        style={{
          perspective: "1000px",
          perspectiveOrigin: "center top",
          transformStyle: "preserve-3d",
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    </ContainerScrollContext.Provider>
  );
};
ContainerScroll.displayName = "ContainerScroll";

export const ContainerSticky = ({
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "sticky top-0 left-0 min-h-[30rem] w-full overflow-hidden",
        className
      )}
      style={{
        perspective: "1000px",
        perspectiveOrigin: "center top",
        transformStyle: "preserve-3d",
        transformOrigin: "50% 50%",
        ...style,
      }}
      {...props}
    />
  );
};
ContainerSticky.displayName = "ContainerSticky";

export const GalleryContainer = ({
  children,
  className,
  style,
  rotateRange = [0, 0.5],
  scaleRange = [0.5, 0.9],
  /** Inclinaison de depart, en degres. */
  angle = 75,
  shiftRange,
  shift = ["0%", "0%"],
  ...props
}: HTMLMotionProps<"div"> & {
  rotateRange?: number[];
  scaleRange?: number[];
  angle?: number;
  /** Plage sur laquelle la grille remonte de `shift` vers sa place. */
  shiftRange?: number[];
  shift?: string[];
}) => {
  const { scrollYProgress } = useContainerScrollContext();
  const rotateX = useTransform(scrollYProgress, rotateRange, [angle, 0]);
  const scale = useTransform(scrollYProgress, scaleRange, [1.2, 1]);
  // Descend la grille tant qu'un bloc de titre occupe le haut du cadre.
  const y = useTransform(scrollYProgress, shiftRange ?? rotateRange, shift);

  return (
    <motion.div
      className={cn(
        "relative grid size-full grid-cols-3 gap-2 rounded-2xl",
        className
      )}
      style={{
        rotateX,
        scale,
        y,
        transformStyle: "preserve-3d",
        perspective: "1000px",
        ...style,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
GalleryContainer.displayName = "GalleryContainer";

export const GalleryCol = ({
  className,
  style,
  yRange = ["0%", "-10%"],
  range = [0.5, 1],
  ...props
}: HTMLMotionProps<"div"> & { yRange?: string[]; range?: number[] }) => {
  const { scrollYProgress } = useContainerScrollContext();
  const y = useTransform(scrollYProgress, range, yRange);

  return (
    <motion.div
      className={cn("relative flex w-full flex-col gap-2", className)}
      style={{
        y,
        ...style,
      }}
      {...props}
    />
  );
};
GalleryCol.displayName = "GalleryCol";

/**
 * Bloc de titre EPINGLE au-dessus de la galerie.
 *
 * Il vit dans le conteneur collant, donc il reste immobile en haut de
 * l'ecran pendant que les colonnes se redressent. Il ne s'en va que
 * sur la plage `range`, calee pour demarrer quand les images sont
 * presque droites.
 */
/**
 * Scene de la galerie : la zone ou les colonnes ont le droit d'exister.
 *
 * Tant que le bloc de titre est epingle, elle demarre SOUS lui, et son
 * contenu y est rogne. Sans ce rognage, la projection du basculement
 * fait remonter les images par-dessus le texte, quel que soit le
 * decalage qu'on leur applique.
 *
 * Le rognage est sur l'element INTERIEUR : `overflow-hidden` coupe a la
 * boite de bordure, marge interieure comprise, donc le poser sur le
 * cadre exterieur ne servirait a rien.
 */
export const GalleryStage = ({
  className,
  style,
  range = [0, 1],
  padding = ["0px", "0px"],
  children,
  ...props
}: Omit<HTMLMotionProps<"div">, "children"> & {
  range?: number[];
  padding?: string[];
  // `HTMLMotionProps` autorise une MotionValue comme enfant ; ici les
  // enfants sont rendus dans un conteneur intermediaire, donc du JSX.
  children?: React.ReactNode;
}) => {
  const { scrollYProgress } = useContainerScrollContext();
  const paddingTop = useTransform(scrollYProgress, range, padding);

  return (
    <motion.div
      className={cn("absolute inset-0", className)}
      style={{ paddingTop, ...style }}
      {...props}
    >
      <div className="relative h-full overflow-hidden">{children}</div>
    </motion.div>
  );
};
GalleryStage.displayName = "GalleryStage";

export const GalleryHeader = ({
  className,
  style,
  range = [0.3, 0.45],
  offset = "-55%",
  ...props
}: HTMLMotionProps<"div"> & { range?: number[]; offset?: string }) => {
  const { scrollYProgress } = useContainerScrollContext();
  const y = useTransform(scrollYProgress, range, ["0%", offset]);
  const opacity = useTransform(scrollYProgress, range, [1, 0]);

  return (
    <motion.div
      className={cn("absolute inset-x-0 top-0 z-20", className)}
      style={{ y, opacity, ...style }}
      {...props}
    />
  );
};
GalleryHeader.displayName = "GalleryHeader";

export const ContainerStagger = React.forwardRef<
  HTMLDivElement,
  HTMLMotionProps<"div">
>(({ className, viewport, transition, ...props }, ref) => {
  return (
    <motion.div
      className={cn("relative", className)}
      ref={ref}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, ...viewport }}
      transition={{
        staggerChildren: transition?.staggerChildren || 0.2,
        ...transition,
      }}
      {...props}
    />
  );
});
ContainerStagger.displayName = "ContainerStagger";

export const ContainerAnimated = React.forwardRef<
  HTMLDivElement,
  HTMLMotionProps<"div">
>(({ className, transition, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      variants={blurVariants}
      transition={transition ?? SPRING_CONFIG}
      {...props}
    />
  );
});
ContainerAnimated.displayName = "ContainerAnimated";
