import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Alert } from "./Alert.vue"
export { default as AlertDescription } from "./AlertDescription.vue"
export { default as AlertTitle } from "./AlertTitle.vue"

export const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
        success:
          "border-success-500/30 bg-success-50 text-success-700 [&>svg]:text-current *:data-[slot=alert-description]:text-success-700/90",
        warning:
          "border-warning-500/30 bg-warning-50 text-warning-700 [&>svg]:text-current *:data-[slot=alert-description]:text-warning-700/90",
        info:
          "border-info-500/30 bg-info-50 text-info-700 [&>svg]:text-current *:data-[slot=alert-description]:text-info-700/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export type AlertVariants = VariantProps<typeof alertVariants>
