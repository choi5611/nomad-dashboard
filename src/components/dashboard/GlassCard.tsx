import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

type GlassCardProps = React.ComponentProps<typeof Card>

export function GlassCard({ className, ...props }: GlassCardProps) {
  return (
    <Card 
      className={cn(
        // backdrop-blur 금지: 계속 회전하는 지구본 위라 블러를 매 프레임 다시 계산해 프레임이 떨어짐 → 배경을 더 진하게
        "bg-black/70 border-white/10 text-white shadow-xl",
        className
      )} 
      {...props} 
    />
  )
}

export { CardContent, CardDescription, CardFooter, CardHeader, CardTitle }
