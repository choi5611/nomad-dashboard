import { useUserSearch } from "@/hooks/useUserSearch"
import { Loader2, Users, MapPin, Search } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import UserProfileModal from "./UserProfileModal"
import { supabase } from "@/lib/supabase"
import { useStore } from "@/store/useStore"

interface UserSearchListProps {
  searchQuery: string
}

export default function UserSearchList({ searchQuery }: UserSearchListProps) {
  const { data: users, isLoading } = useUserSearch(searchQuery)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const setSelectedCity = useStore(state => state.setSelectedCity)
  const cities = useStore(state => state.cities)

  const handleUserClick = async (userId: string) => {
    setSelectedUserId(userId)
    
    // 유저의 최근 게시글이 있는 도시를 찾아 그리로 이동 (선택 사항)
    const { data: latestPost } = await supabase
      .from('posts')
      .select('city_id')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (latestPost && latestPost.city_id) {
      const city = cities.find(c => c.name.toLowerCase() === latestPost.city_id.toLowerCase())
      if (city) {
        setSelectedCity(city)
      }
    }
  }

  if (searchQuery.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/20 text-center px-6">
        <Search className="w-10 h-10 mb-4 opacity-20" />
        <p className="text-sm">검색어를 2글자 이상 입력해서<br/>동료 노마드를 찾아보세요.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/30 gap-3">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm">노마드 검색 중...</p>
      </div>
    )
  }

  if (!users || users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/30 text-center px-6">
        <Users className="w-10 h-10 mb-4 opacity-20" />
        <p className="text-sm">일치하는 노마드가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {users.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleUserClick(user.id)}
            className="flex items-center gap-4 p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group"
          >
            <div className="relative">
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                alt={user.username}
                className="w-12 h-12 rounded-xl object-cover border border-white/10"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center border border-white/10">
                <span className="text-[10px]">{user.country_code || '🌐'}</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
                {user.username}
              </h4>
              <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest mt-0.5">
                XP {user.xp?.toLocaleString() || 0} • NOMAD LEVEL {Math.floor((user.xp || 0) / 1000) + 1}
              </p>
            </div>

            <div className="p-2 bg-white/5 rounded-lg text-white/20 group-hover:text-cyan-400 transition-colors">
              <MapPin className="w-4 h-4" />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          isOpen={!!selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  )
}
