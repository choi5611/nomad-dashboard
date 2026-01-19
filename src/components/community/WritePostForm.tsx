import { X } from "lucide-react"

interface WritePostFormProps {
  onClose: () => void;
  tabs: { id: string, label: string }[];
}

export default function WritePostForm({ onClose, tabs }: WritePostFormProps) {
  return (
    <div className="absolute inset-0 bg-slate-900/98 backdrop-blur-xl z-50 p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">새 게시글 작성</h3>
        <button onClick={onClose} className="text-white/50 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      <form className="space-y-4 flex-1" onSubmit={(e) => e.preventDefault()}>
        {/* 카테고리 선택 */}
        <div>
          <label className="block text-sm font-medium text-white/50 mb-2">카테고리</label>
          <div className="flex gap-2">
            {tabs.filter(t => t.id !== 'all').map(tab => (
              <button
                key={tab.id}
                type="button"
                className="px-3 py-1.5 rounded-full border border-white/10 text-xs text-white/70 hover:bg-white/5 hover:border-cyan-500/50 transition-colors"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 내용 입력 */}
        <div className="flex-1 flex flex-col">
          <label className="block text-sm font-medium text-white/50 mb-2">내용</label>
          <textarea 
            placeholder="이 도시의 경험담을 들려주세요!"
            className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 resize-none"
          />
        </div>

        <button 
          type="submit"
          className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-cyan-900/20"
        >
          게시하기
        </button>
      </form>
    </div>
  )
}