import { useState } from "react"
import { Heart, MessageCircle, ChevronLeft, ChevronRight, Layers } from "lucide-react"
// 이 컴포넌트가 받아서 사용할 데이터들의 "타입"을 정의해줍니다.
interface PostCardProps {
  post: {
    id: string
    content: string
    category: string
    created_at: string
    image_urls?: string[] | null
    profiles: {
      username: string | null
      avatar_url: string | null
    } | null
    likes_count?: number
    comments_count?: number
  }
  typeIcon: any
  typeLabel: string
}
export default function PostCard({ post, typeIcon: TypeIcon, typeLabel }: PostCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const authorName = post.profiles?.username || "익명"
  const avatarUrl = post.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.id}`
  const formattedDate = new Date(post.created_at).toLocaleDateString()

  const images = post.image_urls || []
  const hasMultipleImages = images.length > 1

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-cyan-500/30 transition-colors">
      {/* Post Header */}
      <div className="flex items-center gap-3 mb-3">
        <img src={avatarUrl} alt={authorName} className="w-10 h-10 rounded-full bg-slate-700" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{authorName}</span>
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
              <TypeIcon className="w-3 h-3" />
              {typeLabel}
            </span>
          </div>
          <span className="text-xs text-white/50">{formattedDate}</span>
        </div>
      </div>
      {/* Content */}
      <p className="text-white/90 text-sm leading-relaxed mb-3 whitespace-pre-wrap">{post.content}</p>
      {/* Image */}
      {/* Images Carousel */}
      {images.length > 0 && (
        <div className="relative mb-3 group select-none">
          <div className="aspect-square w-full rounded-lg overflow-hidden bg-black/20 relative">
             <img 
              src={images[currentImageIndex]} 
              alt={`post-image-${currentImageIndex}`} 
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          </div>

          {/* Navigation Buttons */}
          {hasMultipleImages && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white/90 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white/90 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              {/* Pagination Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {images.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-all box-shadow-sm ${
                      currentImageIndex === idx ? "bg-white scale-125" : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
              
              {/* Image Counter Badge (top right) */}
              <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/60 text-white text-xs font-medium flex items-center gap-1 backdrop-blur-sm">
                <Layers className="w-3 h-3" />
                {currentImageIndex + 1}/{images.length}
              </div>
            </>
          )}
        </div>
      )}
      {/* Actions */}
      <div className="flex items-center gap-4 text-white/50 text-sm">
        <button className="flex items-center gap-1 hover:text-pink-400 transition-colors">
          <Heart className="w-4 h-4" /> {post.likes_count || 0}
        </button>
        <button className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
          <MessageCircle className="w-4 h-4" /> {post.comments_count || 0}
        </button>
      </div>
    </div>
  )
}