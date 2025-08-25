
import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const ModernCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    glassEffect?: boolean;
    gradientBorder?: boolean;
    hoverEffect?: boolean;
  }
>(({ className, glassEffect = false, gradientBorder = false, hoverEffect = true, children, ...props }, ref) => {
  const CardContent = (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border shadow-lg transition-all duration-300",
        glassEffect && "glass-morphism border-white/20 dark:border-white/10",
        gradientBorder && "border-2 border-gradient-to-r from-purple-200 via-indigo-200 to-pink-200 dark:from-purple-800 dark:via-indigo-800 dark:to-pink-800",
        !glassEffect && !gradientBorder && "bg-card text-card-foreground border-border",
        hoverEffect && "hover:shadow-xl hover:scale-[1.02]",
        className
      )}
      {...props}
    >
      {/* Animated background gradient */}
      {gradientBorder && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-50/50 via-indigo-50/50 to-pink-50/50 dark:from-purple-950/20 dark:via-indigo-950/20 dark:to-pink-950/20 -z-10" />
      )}
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )

  if (hoverEffect) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -5 }}
      >
        {CardContent}
      </motion.div>
    )
  }

  return CardContent
})
ModernCard.displayName = "ModernCard"

const ModernCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
ModernCardHeader.displayName = "ModernCardHeader"

const ModernCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight text-gradient",
      className
    )}
    {...props}
  />
))
ModernCardTitle.displayName = "ModernCardTitle"

const ModernCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
ModernCardDescription.displayName = "ModernCardDescription"

const ModernCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
ModernCardContent.displayName = "ModernCardContent"

const ModernCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
ModernCardFooter.displayName = "ModernCardFooter"

export { 
  ModernCard, 
  ModernCardHeader, 
  ModernCardFooter, 
  ModernCardTitle, 
  ModernCardDescription, 
  ModernCardContent 
}
