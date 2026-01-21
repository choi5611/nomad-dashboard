import { useState, useEffect } from "react"
import { X, MapPin, Utensils, Coffee, Building2, AlertTriangle, Plus, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useStore } from "@/store/useStore"
import PostCard from "./PostCard"
import WritePostForm from "./WritePostForm"

const typeIcons = {
  experience: Building2,
  restaurant: Utensils,
  cafe: Coffee,
  tip: AlertTriangle,
}

const typeLabels = {
  experience: "경험담",
  restaurant: "맛집",
  cafe: "카페",
  tip: "팁",
}
const TABS = [
  { id: "all", label: "전체" },
  { id: "experience", label: "경험담" },
  { id: "restaurant", label: "맛집" },
  { id: "tip", label: "팁" },
]

export default function CommunitySidebar() {
  const selectedCity = useStore((state) => state.selectedCity)
  const isSidebarOpen = useStore((state) => state.isSidebarOpen)
  const closeSidebar = useStore((state) => state.closeSidebar)
  const [activeTab, setActiveTab] = useState("all")
  const [isWriting, setIsWriting] = useState(false)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPosts = async () => {
    if (!selectedCity) return
    setLoading(true)
    
    try {
      let query = supabase
        .from('posts')
        .select('*, profiles(username, avatar_url)')
        .eq('city_id', selectedCity.name.toLowerCase())
        .order('created_at', { ascending: false })

      if (activeTab !== 'all') {
        query = query.eq('category', activeTab)
      }

      const { data, error } = await query
      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()

    // 실시간 구독 설정
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        () => {
          fetchPosts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedCity, activeTab])


  return (
    <div
      className={`fixed top-0 right-0 h-full w-96 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-50 transform transition-transform duration-300 ease-out ${
        isSidebarOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">
            {selectedCity?.name || "Select a City"}
          </h2>
        </div>
        <div className="flex items-center gap-1">
         <button 
    onClick={() => setIsWriting(true)} 
    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-cyan-400"
  >
    <Plus className="w-5 h-5" />
  </button>
        <button
          onClick={closeSidebar}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-white/70" />
        </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}

            className={`flex-1 py-3 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors ${
              activeTab === tab.id ? "text-cyan-400 border-b-2 border-cyan-400 bg-white/5" 
              : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="overflow-y-auto h-[calc(100%-120px)] p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 text-white/30 gap-3">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">게시글을 불러오는 중...</p>
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => {
            const TypeIcon = typeIcons[post.category as keyof typeof typeIcons] || Building2
            const typeLabel = typeLabels[post.category as keyof typeof typeLabels] || "기타"

            return (
              <PostCard key={post.id} post={post} typeIcon={TypeIcon} typeLabel={typeLabel} />
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-white/30 text-center px-6">
            <p className="text-sm">아직 게시글이 없습니다.<br/>첫 번째 소식을 들려주세요!</p>
          </div>
        )}
      </div>
      {isWriting && (
  <WritePostForm
    onClose={() => setIsWriting(false)}
    onPostCreate={fetchPosts}
    tabs={TABS} 
  />
)}
    </div>
  )
}
