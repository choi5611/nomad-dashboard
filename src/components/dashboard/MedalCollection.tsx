import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/store/useAuth"
import { Shield, Loader2, Award } from "lucide-react"
import { motion } from "framer-motion"

export default function MedalCollection() {
  const { user } = useAuth()
  const [visits, setVisits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVisits = async () => {
      if (!user) return
      setLoading(true)
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .order('visited_at', { ascending: false })
      
      if (!error) {
        setVisits(data || [])
      }
      setLoading(false)
    }

    fetchVisits()
  }, [user])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      {visits.length === 0 ? (
        <div className="col-span-4 py-8 text-center border border-dashed border-white/5 rounded-2xl bg-white/5">
          <p className="text-xs text-white/20 uppercase tracking-widest font-bold mb-1">No Medals Collected</p>
          <p className="text-[10px] text-white/10">Visit cities to earn verified medals</p>
        </div>
      ) : (
        visits.map((visit, index) => (
          <motion.div
            key={visit.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className="group relative flex flex-col items-center gap-1.5"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/30 flex items-center justify-center shadow-lg shadow-cyan-500/10 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6 text-cyan-400" />
              
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
            </div>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter truncate w-full text-center">
              {visit.city_id}
            </span>
            
            {/* Tooltip-like date */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[9px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
              Visited {new Date(visit.visited_at).toLocaleDateString()}
            </div>
          </motion.div>
        ))
      )}
    </div>
  )
}
