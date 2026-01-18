import { useState, useEffect } from "react"
import { GlassCard, CardHeader, CardTitle, CardContent } from "@/components/dashboard/GlassCard"
import { Clock } from "lucide-react"
import { format } from "date-fns"
import { toZonedTime } from "date-fns-tz"

interface ClockWidgetProps {
  timezone: string
}

export default function ClockWidget({ timezone }: ClockWidgetProps) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const zonedTime = toZonedTime(time, timezone)

  return (
    <GlassCard className="w-48">
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-sm font-medium text-blue-200 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Local Time
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        <div className="text-2xl font-bold font-mono">
          {format(zonedTime, "HH:mm")}
        </div>
        <div className="text-xs text-white/60">
          {format(zonedTime, "yyyy-MM-dd")} ({timezone.split('/')[1]})
        </div>
      </CardContent>
    </GlassCard>
  )
}
