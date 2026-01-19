import { Heart, MessageCircle, Building2 } from "lucide-react"
// 이 컴포넌트가 받아서 사용할 데이터들의 "타입"을 정의해줍니다.
interface PostCardProps {
  post: {
    id: number
    author: string
    avatar: string
    content: string
    type: string
    createdAt: string
    likes: number
    comments: number
    image?: string | null
  }
  typeIcon: any
  typeLabel: string
}
export default function PostCard({ post, typeIcon: TypeIcon, typeLabel }: PostCardProps) {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-cyan-500/30 transition-colors">
      {/* Post Header */}
      <div className="flex items-center gap-3 mb-3">
        <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full bg-slate-700" />
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
      <p className="text-white/90 text-sm leading-relaxed mb-3">{post.content}</p>
      {/* Image */}
      {post.image && <img src={post.image} alt="post" className="w-full h-40 object-cover rounded-lg mb-3" />}
      {/* Actions */}
      <div className="flex items-center gap-4 text-white/50 text-sm">
        <button className="flex items-center gap-1 hover:text-pink-400 transition-colors">
          <Heart className="w-4 h-4" /> {post.likes}
        </button>
        <button className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
          <MessageCircle className="w-4 h-4" /> {post.comments}
        </button>
      </div>
    </div>
  )
}