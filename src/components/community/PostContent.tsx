import HashtagText from "../ui/HashtagText"

interface PostContentProps {
  content: string
  onTagClick?: (tag: string) => void
}

export default function PostContent({ content, onTagClick }: PostContentProps) {
  return (
    <div className="text-white/90 text-sm leading-relaxed mb-3">
      <HashtagText text={content} onTagClick={onTagClick} />
    </div>
  )
}
