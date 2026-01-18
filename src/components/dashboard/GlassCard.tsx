import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

type GlassCardProps = React.ComponentProps<typeof Card>

export function GlassCard({ className, ...props }: GlassCardProps) {
  return (
    <Card 
      className={cn(
        "bg-black/20 backdrop-blur-md border-white/10 text-white shadow-xl", // Glassmorphism Core Styles
        className
      )} 
      {...props} 
    />
  )
}

export { CardContent, CardDescription, CardFooter, CardHeader, CardTitle }
