import { useState } from "react"
import { useInfinitePosts } from "@/hooks/useInfinitePosts"
import { useAuth } from "@/store/useAuth"
import PostCard from "./PostCard"
import { Loader2, FileText, Heart, MapPin, Utensils, Coffee, AlertTriangle, Building2 } from "lucide-react"
import { useInView } from "react-intersection-observer"
import { useEffect } from "react"

const typeIcons = {
  experience: MapPin,
  restaurant: Utensils,
  tip: Coffee,
  emergency: AlertTriangle,
  recruitment: Building2
}

const typeLabels = {
  experience: "경험담",
  restaurant: "맛집",
  tip: "팁",
  emergency: "긴급",
  recruitment: "구인"
}

export default function MyActivityList() {
  const [activeTab, setActiveTab] = useState<"posts" | "likes">("posts")
  const { user } = useAuth()
  const { ref, inView } = useInView()

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status
  } = useInfinitePosts({
    category: "all",
    authorId: activeTab === "posts" ? user?.id : undefined,
    likedByUserId: activeTab === "likes" ? user?.id : undefined
  })

  // 더 보기 버튼 클릭 시 실행
  const handleLoadMore = () => {
    if (hasNextPage) {
      fetchNextPage()
    }
  }

  if (!user) return null

  const allPosts = data?.pages.flatMap(page => page) || []

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
        <button
          onClick={() => setActiveTab("posts")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "posts" 
              ? "bg-cyan-500 text-white shadow-lg" 
              : "text-white/40 hover:bg-white/5"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          MY POSTS
        </button>
        <button
          onClick={() => setActiveTab("likes")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "likes" 
              ? "bg-pink-500 text-white shadow-lg" 
              : "text-white/40 hover:bg-white/5"
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          LIKED
        </button>
      </div>

      {/* List Container */}
      <div className="space-y-4">
        {status === "pending" ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
          </div>
        ) : allPosts.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl">
            <p className="text-sm text-white/20">활동 내역이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {allPosts.map((post) => {
                 const TypeIcon = typeIcons[post.category as keyof typeof typeIcons] || Building2
                 const typeLabel = typeLabels[post.category as keyof typeof typeLabels] || "기타"
                 
                 return (
                   <div key={post.id} className="scale-[0.9] origin-top -mb-10 first:mt-0">
                      <PostCard 
                        post={post} 
                        typeIcon={TypeIcon}
                        typeLabel={typeLabel}
                      />
                   </div>
                 )
              })}
            </div>
            
            {/* Load More Button */}
            {hasNextPage && (
              <div className="pt-8 pb-4">
                <button
                  onClick={handleLoadMore}
                  disabled={isFetchingNextPage}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold text-white/40 hover:text-cyan-400 transition-all flex items-center justify-center gap-2 group"
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>LOAD 10 MORE</span>
                      <span className="text-white/10 group-hover:text-cyan-500/30">|</span>
                      <span className="text-[9px] opacity-60">SHOWING {allPosts.length}</span>
                    </>
                  )}
                </button>
              </div>
            )}
            
            {!hasNextPage && allPosts.length > 0 && (
              <p className="text-center py-4 text-[9px] text-white/10 uppercase tracking-widest font-mono">
                End of tactical logs
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
