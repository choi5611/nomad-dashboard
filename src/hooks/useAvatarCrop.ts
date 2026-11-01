import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { getCroppedImg } from "@/utils/cropImage"
import { useQueryClient } from "@tanstack/react-query"
import type { User } from "@supabase/supabase-js"

export function useAvatarCrop(user: User | null, fetchProfile: (userId: string) => Promise<void>) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const queryClient = useQueryClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const imageDataUrl = URL.createObjectURL(file)
      setImageSrc(imageDataUrl)
    }
  }

  const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const handleAvatarUpload = async () => {
    if (!imageSrc || !croppedAreaPixels || !user) return

    setUploading(true)
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
      if (!croppedImageBlob) throw new Error("이미지 크롭 실패")

      const fileName = `${user.id}/${crypto.randomUUID()}.webp`
      const filePath = fileName

      // Storage 업로드
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, croppedImageBlob, {
          contentType: "image/webp",
          upsert: true,
        })

      if (uploadError) throw uploadError

      // Public URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath)

      // Profiles 테이블 업데이트
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id)

      if (updateError) throw updateError

      await fetchProfile(user.id)

      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["comments"] })

      toast.success("프로필 이미지가 변경되었습니다.")
      setImageSrc(null) // 크롭 모달 닫기
    } catch (error: any) {
      console.error(error)
      toast.error("이미지 업로드 실패: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  return {
    imageSrc,
    setImageSrc,
    crop,
    setCrop,
    zoom,
    setZoom,
    uploading,
    handleFileChange,
    onCropComplete,
    handleAvatarUpload
  }
}
