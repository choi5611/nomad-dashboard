import { useStore } from "@/store/useStore"
import { X, MapPin, Utensils, Coffee, Building2, AlertTriangle, Heart, MessageCircle } from "lucide-react"

// 목데이터 - 나중에 Supabase로 교체
const MOCK_POSTS = [
  {
    id: 1,
    type: "experience",
    author: "nomad_jenny",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jenny",
    content: "서울 강남 코워킹스페이스 추천! WeWork 선릉점 정말 좋아요. 커피도 무제한이고 분위기 최고 👍",
    image: null,
    likes: 24,
    comments: 5,
    createdAt: "2시간 전"
  },
  {
    id: 2,
    type: "restaurant",
    author: "digital_mike",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
    content: "을지로 노포 감자탕 맛집 발견! 가성비 미쳤어요 🍲",
    image: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400",
    likes: 42,
    comments: 12,
    createdAt: "5시간 전"
  },
  {
    id: 3,
    type: "tip",
    author: "sarah_travels",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    content: "한국 입국 시 K-ETA 필수! 미리 신청해두세요. 승인까지 1-2일 걸릴 수 있어요.",
    image: null,
    likes: 89,
    comments: 23,
    createdAt: "1일 전"
  },
]

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

export default function CommunitySidebar() {
  const selectedCity = useStore((state) => state.selectedCity)
  const isSidebarOpen = useStore((state) => state.isSidebarOpen)
  const closeSidebar = useStore((state) => state.closeSidebar)

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
        <button
          onClick={closeSidebar}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-white/70" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {["전체", "경험담", "맛집", "팁"].map((tab) => (
          <button
            key={tab}
            className="flex-1 py-3 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="overflow-y-auto h-[calc(100%-120px)] p-4 space-y-4">
        {MOCK_POSTS.map((post) => {
          const TypeIcon = typeIcons[post.type as keyof typeof typeIcons] || Building2
          const typeLabel = typeLabels[post.type as keyof typeof typeLabels] || "기타"

          return (
            <div
              key={post.id}
              className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-cyan-500/30 transition-colors"
            >
              {/* Post Header */}
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={post.avatar}
                  alt={post.author}
                  className="w-10 h-10 rounded-full bg-slate-700"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{post.author}</span>
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
                      <TypeIcon className="w-3 h-3" />
                      {typeLabel}
                    </span>
                  </div>
                  <span className="text-xs text-white/50">{post.createdAt}</span>
                </div>
              </div>

              {/* Content */}
              <p className="text-white/90 text-sm leading-relaxed mb-3">
                {post.content}
              </p>

              {/* Image */}
              {post.image && (
                <img
                  src={post.image}
                  alt="post"
                  className="w-full h-40 object-cover rounded-lg mb-3"
                />
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 text-white/50 text-sm">
                <button className="flex items-center gap-1 hover:text-pink-400 transition-colors">
                  <Heart className="w-4 h-4" />
                  {post.likes}
                </button>
                <button className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  {post.comments}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
