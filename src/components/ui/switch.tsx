"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type SwitchProps = React.InputHTMLAttributes<HTMLInputElement> & {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export function Switch({ checked, onCheckedChange, className, ...props }: SwitchProps) {
  return (
    <label className={cn("relative inline-flex h-5 w-9 cursor-pointer items-center", className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className="peer sr-only"
        {...props}
      />
      <span className="absolute inset-0 rounded-full bg-muted-foreground/30 transition-colors peer-checked:bg-primary peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2" />
      <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-background transition-transform peer-checked:translate-x-4" />
    </label>
  )
}
