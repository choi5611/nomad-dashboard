import { useState, useEffect } from "react"
import { X, MapPin, Utensils, Coffee, Building2, AlertTriangle, Plus, Loader2, MessageSquare, Search, RefreshCw } from "lucide-react"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { useStore } from "@/store/useStore"
import { useInView } from "react-intersection-observer"
import { useInfinitePosts } from "@/hooks/useInfinitePosts"
import PostCard from "./PostCard"
import WritePostForm from "./WritePostForm"
import UserSearchList from "./UserSearchList"
import { useQueryClient } from "@tanstack/react-query"
import PullToRefresh from "./PullToRefresh"

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
  { id: "users", label: "노마드" },
]

const POPULAR_TAGS = ["맛집", "디지털노마드", "카페", "태국", "한달살기", "작업공간"]

export default function CommunitySidebar() {
  const selectedCity = useStore((state) => state.selectedCity)
  const isSidebarOpen = useStore((state) => state.isSidebarOpen)
  const closeSidebar = useStore((state) => state.closeSidebar)
  const [activeTab, setActiveTab] = useState("all")
  const [isWriting, setIsWriting] = useState(false)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const { isChatOpen, toggleChat, setActiveTab: setGlobalActiveTab } = useStore()
  const isMobile = useMediaQuery("(max-width: 767px)")
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const { ref, inView } = useInView()
  
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    status 
  } = useInfinitePosts({ 
    category: activeTab, 
    cityId: selectedCity?.name?.toLowerCase(),
    hashtag: selectedTag,
    searchQuery: searchQuery
  })

  const navigationTarget = useStore((state) => state.navigationTarget)

  useEffect(() => {
    if (navigationTarget) {
      setActiveTab("all")
      setSelectedTag(null)
      setSearchQuery("")
    }
  }, [navigationTarget])

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, fetchNextPage])

  const posts = data?.pages.flatMap((page) => page) || []

  return (
    <div
      className={`fixed top-0 right-0 h-full w-full md:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-50 transform transition-transform duration-300 ease-out ${
        isSidebarOpen ? "translate-x-0" : "translate-x-full"
      } ${isMobile ? 'pb-[80px]' : ''}`}
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
            title="새 게시글 작성"
          >
            <Plus className="w-5 h-5" />
          </button>
          
          {/* Desktop Refresh Button */}
          {!isMobile && (
            <button 
              onClick={async () => {
                setIsRefreshing(true)
                await queryClient.refetchQueries({ queryKey: ["posts"] })
                setTimeout(() => setIsRefreshing(false), 500)
              }} 
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-cyan-400"
              title="새로고침"
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button 
            onClick={toggleChat} 
            className={`p-2 rounded-lg transition-colors  ${
              isChatOpen ? "bg-cyan-500/20 text-cyan-400 " : "hover:bg-white/10 text-cyan-400/60 hover:text-cyan-400 "
            }`}
            title="실시간 채팅"
          >
            <MessageSquare className="w-5 h-5 " />
          </button>
        <button
          onClick={closeSidebar}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-white/70" />
        </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-white/5 bg-white/5">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-cyan-400 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts, users, tags..."
            className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-10 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-white/20"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-3 h-3 text-white/40" />
            </button>
          )}
        </div>
        
        {/* Popular Tags Suggestion */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {POPULAR_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setSearchQuery(`#${tag}`)}
              className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-white/40 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              if (tab.id === "users") setGlobalActiveTab('friends')
              else setGlobalActiveTab('city')
            }}

            className={`flex-1 py-3 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors ${
              activeTab === tab.id ? "text-cyan-400 border-b-2 border-cyan-400 bg-white/5" 
              : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tag Badge */}
      {selectedTag && (
        <div className="px-4 py-2 bg-cyan-500/10 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-cyan-400">TAG:</span>
            <span className="px-2 py-0.5 bg-cyan-500 text-white text-xs font-bold rounded-full">
              #{selectedTag}
            </span>
          </div>
          <button 
            onClick={() => setSelectedTag(null)}
            className="text-xs text-white/40 hover:text-white transition-colors"
          >
            필터 초기화
          </button>
        </div>
      )}

      {/* Content Area */}
      <PullToRefresh 
        onRefresh={async () => {
          console.log("🔄 Pull-to-refresh triggered, resetting posts...")
          await queryClient.refetchQueries({ queryKey: ["posts"] })
        }}
        className="h-[calc(100%-120.5px)]"
        disabled={!isMobile}
      >
        <div className="p-4 space-y-4">
          {activeTab === "users" ? (
            <UserSearchList searchQuery={searchQuery} />
          ) : status === 'pending' ? (
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
                    onDelete={async () => {
                      console.log("♻️ Post deleted, resetting all post queries for fresh data...")
                      await queryClient.resetQueries({ queryKey: ["posts"] })
                      // 만약 가상 뷰 싱크가 느릴 경우를 대비해 1초 뒤 한 번 더 무효화
                      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["posts"] }), 1000)
                    }}
                    onTagClick={(tag) => setSelectedTag(tag)}
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
      </PullToRefresh>
      {isWriting && (
        <WritePostForm
          onClose={() => setIsWriting(false)}
          onPostCreate={() => queryClient.invalidateQueries({ queryKey: ["posts"] })}
          tabs={TABS} 
        />
      )}
    </div>
  )
}
