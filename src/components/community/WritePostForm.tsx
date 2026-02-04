import { useState, useRef } from "react"
import { X, Send, Loader2, ImagePlus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/store/useAuth"
import { useStore } from "@/store/useStore"
import { toast } from "sonner"
import { v4 as uuidv4 } from 'uuid'
import { useMediaQuery } from "@/hooks/useMediaQuery"

import { compressImage } from "@/utils/media"

interface WritePostFormProps {
  onClose: () => void;
  onPostCreate: () => void;
  tabs: { id: string, label: string }[];
}

export default function WritePostForm({ onClose, onPostCreate, tabs }: WritePostFormProps) {
  const [categoryId, setCategoryId] = useState("experience")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isMobile = useMediaQuery("(max-width: 767px)")
  
  const user = useAuth((state) => state.user)
  const selectedCity = useStore((state) => state.selectedCity)
  const discoveredCity = useStore((state) => state.discoveredCity)
  const registerCity = useStore((state) => state.registerCity)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + images.length > 12) {
      toast.error("미디어는 최대 12개까지 업로드할 수 있습니다.")
      return
    }

    setImages(prev => [...prev, ...files])

    const newPreviews = files.map(file => URL.createObjectURL(file))
    setPreviews(prev => [...prev, ...newPreviews])
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => {
      // 메모리 누수 방지를 위해 URL 해제
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const uploadImages = async () => {
    const uploadPromises = images.map(async (file) => {
      const isVideo = file.type.startsWith('video/')
      let finalFile = file

      // 이미지일 경우에만 압축 진행
      if (!isVideo) {
        try {
          finalFile = await compressImage(file, { maxWidth: 1200, quality: 0.7 })
        } catch (err) {
          console.error("Compression failed, using original file:", err)
        }
      }

      const fileExt = finalFile.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `${user?.id}/${fileName}`

      const bucketName = isVideo ? 'post-videos' : 'post-images'

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, finalFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath)

      return publicUrl
    })

    return Promise.all(uploadPromises)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error("로그인이 필요합니다.")
      return
    }
    if (!content.trim()) return

    setLoading(true)
    try {
      // 1. 이미지 업로드
      let imageUrls: string[] = []
      if (images.length > 0) {
        imageUrls = await uploadImages()
      }

      // 2. 게시글 저장 전: 임시 탐사 상태인지 체크하여 공식 등록
      let finalCityId = selectedCity?.name?.toLowerCase() || "unknown"
      
      if (discoveredCity && selectedCity?.name === discoveredCity.name) {
        const success = await registerCity(discoveredCity)
        if (success) {
          toast.success(`축하합니다! ${discoveredCity.name}의 최초 발견자가 되셨습니다! 🏆`)
          finalCityId = discoveredCity.name.toLowerCase()
        }
      }

      // 3. 게시글 저장 (image_urls 배열 저장)
      const { error } = await supabase.from("posts").insert({
        author_id: user.id,
        city_id: finalCityId,
        category: categoryId,
        content: content.trim(),
        image_urls: imageUrls, // 배열로 저장
      })

      if (error) throw error
      
      // 3. XP 보상 (+10 XP)
      await supabase.rpc('increment_xp', { user_id: user.id, amount: 10 })
      useAuth.getState().fetchProfile(user.id)

      toast.success("게시글이 성공적으로 등록되었습니다! (+10 XP)")
      onPostCreate() // 목록 새로고침
      onClose()
    } catch (error: any) {
      toast.error("업로드 중 오류가 발생했습니다: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`absolute inset-0 bg-slate-900/98 backdrop-blur-xl z-50 p-6 flex flex-col ${isMobile ? 'pb-[88px]' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">새 게시글 작성</h3>
        <button 
          onClick={onClose} 
          className="p-2 text-white/50 hover:text-white transition-colors"
          disabled={loading}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form className="space-y-6 flex-1 flex flex-col" onSubmit={handleSubmit}>
        {/* 카테고리 선택 */}
        <div>
          <label className="block text-sm font-medium text-white/50 mb-3">카테고리</label>
          <div className="flex flex-wrap gap-2">
            {tabs.filter(t => t.id !== 'all').map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryId(tab.id)}
                className={`px-4 py-2 rounded-xl border text-sm transition-all ${
                  categoryId === tab.id 
                    ? "bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-900/20" 
                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 내용 입력 */}
        <div className="flex-1 flex flex-col min-h-[150px]">
          <label className="block text-sm font-medium text-white/50 mb-3">내용</label>
          <textarea 
            placeholder={`${selectedCity?.name}에서의 특별한 경험을 공유해 주세요!`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading}
            className="w-full h-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 resize-none transition-all leading-relaxed"
          />
        </div>

        {/* 이미지 업로드 */}
        <div>
          <label className="block text-sm font-medium text-white/50 mb-3">
            사진/동영상 ({images.length}/12)
          </label>
          
          <div className="grid grid-cols-4 gap-2">
            {/* 추가 버튼 */}
            {images.length < 12 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded-xl flex flex-col items-center justify-center text-white/50 hover:text-cyan-400 transition-all"
              >
                <ImagePlus className="w-6 h-6 mb-1" />
                <span className="text-xs">추가</span>
              </button>
            )}

            {/* 미리보기 목록 */}
            {previews.map((preview, index) => {
              const isVideo = images[index]?.type.startsWith('video/')
              return (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-white/10">
                  {isVideo ? (
                    <video src={preview} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={preview} alt={`preview ${index}`} className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*,video/*" 
            multiple 
            className="hidden" 
            onChange={handleImageChange}
          />
        </div>

        <button 
          type="submit"
          disabled={loading || !content.trim()}
          className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5" />
              게시물 올리기
            </>
          )}
        </button>
      </form>
    </div>
  )
}