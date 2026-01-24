import Cropper from "react-easy-crop"
import { Loader2 } from "lucide-react"

interface AvatarCropModalProps {
  imageSrc: string
  crop: { x: number; y: number }
  zoom: number
  uploading: boolean
  onCropChange: (crop: { x: number; y: number }) => void
  onZoomChange: (zoom: number) => void
  onCropComplete: (croppedArea: any, croppedAreaPixels: any) => void
  onCancel: () => void
  onConfirm: () => void
}

export default function AvatarCropModal({
  imageSrc,
  crop,
  zoom,
  uploading,
  onCropChange,
  onZoomChange,
  onCropComplete,
  onCancel,
  onConfirm
}: AvatarCropModalProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-md aspect-square bg-slate-900 rounded-2xl overflow-hidden">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={onCropChange}
          onCropComplete={onCropComplete}
          onZoomChange={onZoomChange}
          cropShape="round"
          showGrid={false}
        />
      </div>

      <div className="mt-8 w-full max-w-md space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-white/40 px-1">
            <span>확대/축소</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-all"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={uploading}
            className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "적용하기"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
