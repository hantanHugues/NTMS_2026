"use client"

import { Slider as SliderPrimitive } from "@base-ui/react/slider"
import { cn } from "cn"

function Slider({ className, ...props }: SliderPrimitive.Root.Props) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn("w-full", className)}
      {...props}
    >
      {/* La zone de saisie est plus haute que la piste : sur un écran
          tactile, on attrape le curseur sans viser le trait. */}
      <SliderPrimitive.Control className="flex h-11 w-full touch-none items-center select-none">
        <SliderPrimitive.Track className="h-1.5 w-full rounded-full bg-border">
          <SliderPrimitive.Indicator className="h-full rounded-full bg-primary" />
          <SliderPrimitive.Thumb className="size-5 rounded-full bg-background shadow-sm ring-2 ring-primary transition-shadow focus-visible:ring-4 focus-visible:outline-none" />
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
