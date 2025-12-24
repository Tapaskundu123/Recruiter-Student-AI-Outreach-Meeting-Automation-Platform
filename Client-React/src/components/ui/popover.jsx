import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverPortal = PopoverPrimitive.Portal

const PopoverContent = React.forwardRef(({ className, align = "start", sideOffset = 4, children, ...props }, ref) => (
  <PopoverPortal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-auto rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className
      )}
      {...props}
    >
      {children}
    </PopoverPrimitive.Content>
  </PopoverPortal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

const PopoverArrow = React.forwardRef(({ className, ...props }, ref) => (
  <PopoverPrimitive.Arrow ref={ref} className={cn("fill-popover", className)} {...props} />
))
PopoverArrow.displayName = PopoverPrimitive.Arrow.displayName

const PopoverClose = PopoverPrimitive.Close

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverPortal,
  PopoverArrow,
  PopoverClose,
}
