
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const modernButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg hover:from-purple-600 hover:to-indigo-700 hover:shadow-xl",
        destructive: "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg hover:from-red-600 hover:to-pink-700 hover:shadow-xl",
        outline: "border-2 border-purple-200 dark:border-purple-700 bg-transparent hover:bg-purple-50 dark:hover:bg-purple-950/30 text-purple-700 dark:text-purple-300",
        secondary: "bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-900 dark:text-gray-100 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600",
        ghost: "hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300 rounded-full",
        link: "text-purple-600 dark:text-purple-400 underline-offset-4 hover:underline hover:text-purple-700 dark:hover:text-purple-300",
        gradient: "bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-105",
        glass: "glass-morphism border border-white/20 dark:border-white/10 text-gray-800 dark:text-gray-200 hover:bg-white/40 dark:hover:bg-black/40",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8",
        icon: "h-10 w-10",
        xl: "h-14 rounded-xl px-10 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ModernButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof modernButtonVariants> {
  asChild?: boolean;
  withAnimation?: boolean;
  glowEffect?: boolean;
}

const ModernButton = React.forwardRef<HTMLButtonElement, ModernButtonProps>(
  ({ className, variant, size, asChild = false, withAnimation = true, glowEffect = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    const ButtonContent = (
      <Comp
        className={cn(modernButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {/* Shimmer effect */}
        {variant === "default" || variant === "gradient" ? (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        ) : null}
        
        {/* Glow effect */}
        {glowEffect && (
          <div className="absolute inset-0 rounded-inherit bg-inherit opacity-50 blur-md -z-10 group-hover:opacity-70 transition-opacity duration-300" />
        )}
        
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      </Comp>
    )

    if (withAnimation) {
      return (
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", damping: 25, stiffness: 400 }}
        >
          {ButtonContent}
        </motion.div>
      )
    }

    return ButtonContent
  }
)
ModernButton.displayName = "ModernButton"

export { ModernButton, modernButtonVariants }
