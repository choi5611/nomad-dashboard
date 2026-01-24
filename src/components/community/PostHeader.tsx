import { Trash2 } from "lucide-react"

interface PostHeaderProps {
  authorName: string
  avatarUrl: string
  formattedDate: string
  isAuthor: boolean
  typeIcon: any
  typeLabel: string
  onProfileClick: () => void
  onDelete: () => void
}

export default function PostHeader({
  authorName,
  avatarUrl,
  formattedDate,
  isAuthor,
  typeIcon: TypeIcon,
  typeLabel,
  onProfileClick,
  onDelete
}: PostHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <img
        src={avatarUrl}
        alt={authorName}
        className="w-10 h-10 rounded-full bg-slate-700 cursor-pointer hover:ring-2 hover:ring-cyan-500/50 transition-all"
        onClick={onProfileClick}
      />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="font-medium text-white cursor-pointer hover:text-cyan-400 transition-colors"
              onClick={onProfileClick}
            >
              {authorName}
            </span>
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
              <TypeIcon className="w-3 h-3" />
              {typeLabel}
            </span>
          </div>
          {isAuthor && (
            <button
              onClick={onDelete}
              className="p-1.5 text-white/30 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <span className="text-xs text-white/50">{formattedDate}</span>
      </div>
    </div>
  )
}
