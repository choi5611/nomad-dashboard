import { useState, useEffect } from "react"
import { X, MapPin, Utensils, Coffee, Building2, AlertTriangle, Plus, Loader2 } from "lucide-react"
import { useStore } from "@/store/useStore"
import { useInView } from "react-intersection-observer"
import { useInfinitePosts } from "@/hooks/useInfinitePosts"
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
  
  const { ref, inView } = useInView()
  
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    status,
    refetch 
  } = useInfinitePosts({ 
    category: activeTab, 
    cityId: selectedCity?.name?.toLowerCase() // 이름 기반 매칭 주의: DB와 일치해야 함
  })

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, fetchNextPage])

  const posts = data?.pages.flatMap((page) => page) || []

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
      <div className="overflow-y-auto h-[calc(100%-120px)] p-4 space-y-4 no-scrollbar">
        {status === 'pending' ? (
          <div className="flex flex-col items-center justify-center h-40 text-white/30 gap-3">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">게시글을 불러오는 중...</p>
          </div>
        ) : posts.length > 0 ? (
          <>
            {posts.map((post) => {
              const TypeIcon = typeIcons[post.category as keyof typeof typeIcons] || Building2
              const typeLabel = typeLabels[post.category as keyof typeof typeLabels] || "기타"

              return (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  typeIcon={TypeIcon} 
                  typeLabel={typeLabel} 
                  onDelete={() => refetch()}
                />
              )
            })}
             {/* Infinite Scroll Trigger */}
            <div ref={ref} className="h-10 flex justify-center items-center">
              {isFetchingNextPage && <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-white/30 text-center px-6">
            <p className="text-sm">아직 게시글이 없습니다.<br/>첫 번째 소식을 들려주세요!</p>
          </div>
        )}
      </div>
      {isWriting && (
        <WritePostForm
          onClose={() => setIsWriting(false)}
          onPostCreate={() => refetch()}
          tabs={TABS} 
        />
      )}
    </div>
  )
}
