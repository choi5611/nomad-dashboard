import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { MapPin, Calendar, Loader2, Award } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface TravelLogProps {
  userId: string
  compact?: boolean
}

export default function TravelLog({ userId, compact = false }: TravelLogProps) {
  const [visits, setVisits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchVisits() {
      setLoading(true)
      try {
        const { data: visitData, error: visitError } = await supabase
          .from('visits')
          .select('*')
          .eq('user_id', userId)

        if (!visitError && visitData) {
          const { data: cityData } = await supabase.from('cities').select('name, display_name, country_code')
          
          const enrichedVisits = visitData.map(v => ({
            ...v,
            city: cityData?.find(c => c.name === v.city_id)
          })).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
          
          setVisits(enrichedVisits)
        }
      } catch (err) {
        console.error("Travel Log fetch error:", err)
      } finally {
        setLoading(false)
      }
    }
    if (userId) fetchVisits()
  }, [userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full">
      {!compact && (
        <div className="flex items-center gap-2 mb-6 px-1">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.2em] opacity-60">Operations Log</h3>
        </div>
      )}
      
      <div className={`space-y-6 ${compact ? '' : 'max-h-[350px]'} overflow-y-auto pr-2 no-scrollbar`}>
        {visits.length > 0 ? (
          visits.map((visit, index) => (
            <motion.div 
              key={visit.id || index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex gap-4 relative group"
            >
              {/* Timeline Line */}
              {index !== visits.length - 1 && (
                <div className="absolute left-[13px] top-7 bottom-[-24px] w-[2px] bg-gradient-to-b from-cyan-500/20 to-transparent" />
              )}
              
              {/* Timeline Indicator */}
              <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-1 transition-colors group-hover:border-cyan-500/30">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                    <span>{visit.city?.display_name || 'Unknown City'}</span>
                  </h4>
                  <span className="text-[10px] text-white/20 font-mono shrink-0">
                    {new Date(visit.created_at).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-white/40 uppercase font-bold tracking-tighter">
                  <MapPin className="w-2.5 h-2.5" />
                  <span>{visit.city?.country_code || '??'} • CERTIFIED</span>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10 flex flex-col items-center gap-3">
            <Award className="w-6 h-6 text-white/10" />
            <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest leading-relaxed">
              No certified visits<br/>detected on this signal.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
