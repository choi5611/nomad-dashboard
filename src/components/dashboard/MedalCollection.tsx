import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Loader2, Award } from "lucide-react"
import { motion } from "framer-motion"

interface MedalCollectionProps {
  userId: string
}

export default function MedalCollection({ userId }: MedalCollectionProps) {
  const [visits, setVisits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVisits = async () => {
      if (!userId) {
        setLoading(false)
        return
      }
      setLoading(true)
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (!error) {
        setVisits(data || [])
      }
      setLoading(false)
    }

    fetchVisits()
  }, [userId])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-4" style={{ perspective: "1000px" }}>
      {visits.length === 0 ? (
        <div className="col-span-4 py-8 text-center border border-dashed border-white/5 rounded-2xl bg-white/5">
          <p className="text-xs text-white/20 uppercase tracking-widest font-bold mb-1">No Certification Found</p>
          <p className="text-[10px] text-white/10">Authorized visits will appear as encrypted medals</p>
        </div>
      ) : (
        visits.map((visit, index) => (
          <motion.div
            key={visit.id}
            initial={{ scale: 0, opacity: 0, rotateY: 180 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ 
              type: "spring",
              damping: 15,
              stiffness: 150,
              delay: index * 0.1 
            }}
            style={{ transformStyle: "preserve-3d" }}
            className="group relative flex flex-col items-center gap-1.5"
          >
            {/* Premium Medal Container */}
            <div className="w-14 h-14 rounded-full relative flex items-center justify-center overflow-hidden border border-white/20 shadow-xl transition-all duration-500 group-hover:border-cyan-400 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] bg-gradient-to-br from-slate-800 to-black">
              
              {/* Background Animated Glow */}
              <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(34,211,238,0.3),transparent)] opacity-0 group-hover:opacity-100 animate-[spin_3s_linear_infinite]" />
              
              {/* Internal Glass Filter */}
              <div className="absolute inset-[1.5px] rounded-full bg-slate-900/90 backdrop-blur-md z-10 flex items-center justify-center">
                <div className="relative z-20 flex flex-col items-center">
                  <Award className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                  <span className="text-[7px] text-cyan-400/50 font-mono font-bold mt-0.5 tracking-tighter">CERTIFIED</span>
                </div>
              </div>
              
              {/* Holographic Shine Effect */}
              <div className="absolute inset-0 z-30 bg-gradient-to-tr from-transparent via-white/20 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none" />
            </div>

            <div className="flex flex-col items-center gap-0.5 px-1 max-w-full">
               <span className="text-[10px] font-bold text-white/40 group-hover:text-cyan-400 uppercase tracking-widest truncate w-full text-center transition-colors">
                 {visit.city_id}
               </span>
               <div className="h-0.5 w-4 bg-white/10 group-hover:w-full group-hover:bg-cyan-500/50 transition-all duration-300" />
            </div>
            
            {/* Tooltip - Increased height to avoid overlapping */}
            <div className="absolute bottom-[100%] left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[100] transform translate-y-2 group-hover:translate-y-0">
              <div className="bg-slate-900 border border-cyan-500/30 px-3 py-1.5 rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                 <p className="text-[8px] text-cyan-400 font-mono uppercase tracking-tighter mb-0.5">Verification Signal</p>
                 <p className="text-[10px] text-white font-bold whitespace-nowrap">
                   Base: {visit.city_id.toUpperCase()}
                 </p>
                 <p className="text-[9px] text-white/40 font-mono mt-1">
                   Lat-Trace: {visit.created_at ? new Date(visit.created_at).toLocaleDateString() : 'Unknown Date'}
                 </p>
              </div>
              {/* Tooltip Arrow */}
              <div className="w-2 h-2 bg-slate-900 border-r border-b border-cyan-500/30 rotate-45 mx-auto -mt-1" />
            </div>
          </motion.div>
        ))
      )}
    </div>
  )
}
