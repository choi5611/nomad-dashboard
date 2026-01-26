import { motion } from "framer-motion"
import { getNomadRank } from "@/utils/rankUtils"
import AnimatedNumber from "@/components/ui/AnimatedNumber"

interface NomadRankBadgeProps {
  xp: number
}

export default function NomadRankBadge({ xp }: NomadRankBadgeProps) {
  const rank = getNomadRank(xp)
  const Icon = rank.icon
  const progress = Math.min(100, (xp / rank.nextLevelXp) * 100)

  return (
    <div className="mt-6 w-full bg-white/5 border border-white/10 rounded-2xl p-4 relative overflow-hidden group/rank">
      {/* Background Glow */}
      <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-20 transition-colors ${rank.color.replace('text-', 'bg-')}`} />

      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg bg-black/40 border border-white/5 ${rank.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Nomad Standing</p>
          <p className={`text-sm font-bold tracking-tight ${rank.color}`}>{rank.name}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] uppercase font-mono tracking-tighter">
          <span className="text-white/40">Knowledge (XP)</span>
          <span className="text-white/60">
            <AnimatedNumber value={xp} /> / {rank.nextLevelXp === 99999 ? 'MAX' : rank.nextLevelXp}
          </span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className={`h-full opacity-80 ${rank.color.replace('text-', 'bg-')}`}
          />
        </div>
      </div>
    </div>
  )
}
