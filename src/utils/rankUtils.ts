import { Trophy, Compass, Star, Crown, Rocket } from "lucide-react"

export interface NomadRank {
  name: string
  xp: number
  color: string
  icon: any
  nextLevelXp: number
}

export const getNomadRank = (xp: number = 0): NomadRank => {
  if (xp >= 1000) return { 
    name: 'Grand Nomad', 
    xp, 
    color: 'text-amber-400', 
    icon: Crown,
    nextLevelXp: 99999 
  }
  if (xp >= 500) return { 
    name: 'Elite Explorer', 
    xp, 
    color: 'text-purple-400', 
    icon: Rocket,
    nextLevelXp: 1000 
  }
  if (xp >= 200) return { 
    name: 'Steady Traveler', 
    xp, 
    color: 'text-cyan-400', 
    icon: Star,
    nextLevelXp: 500 
  }
  if (xp >= 50) return { 
    name: 'Active Voyager', 
    xp, 
    color: 'text-green-400', 
    icon: Compass,
    nextLevelXp: 200 
  }
  return { 
    name: 'Newcomer', 
    xp, 
    color: 'text-white/40', 
    icon: Trophy,
    nextLevelXp: 50 
  }
}
