import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

interface ImageViewerProps {
  images: string[]
  initialIndex?: number
  isOpen: boolean
  onClose: () => void
}

export default function ImageViewer({
  images,
  initialIndex = 0,
  isOpen,
  onClose
}: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  // Reset index when modal opens (effect 대신 렌더 단계 조정 패턴)
  const [lastResetKey, setLastResetKey] = useState<string | null>(null)
  const resetKey = isOpen ? `${initialIndex}` : "closed"
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey)
    if (isOpen) setCurrentIndex(initialIndex)
  }

  const nextImage = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const prevImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") prevImage()
      if (e.key === "ArrowRight") nextImage()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, currentIndex])

  if (!isOpen) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center touch-none"
          onClick={onClose}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors z-50 rounded-full hover:bg-white/10"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              {currentIndex > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white transition-colors z-50 rounded-full hover:bg-white/10"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
              )}
              {currentIndex < images.length - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white transition-colors z-50 rounded-full hover:bg-white/10"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              )}
            </>
          )}

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-4 text-white/70 font-medium z-50">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Main Content */}
          <div 
            className="relative w-full h-full max-w-7xl max-h-[90vh] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full h-full flex items-center justify-center"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.y) > 100) {
                  onClose()
                }
              }}
            >
              {(() => {
                const url = images[currentIndex]
                const isVideo = url.toLowerCase().match(/\.(mp4|mov|webm|ogv|m4v)/) || url.includes('/post-videos/')

                if (isVideo) {
                  return (
                    <video
                      src={url}
                      className="max-w-full max-h-full rounded-lg shadow-2xl"
                      controls
                      autoPlay
                      playsInline
                      loop
                    />
                  )
                }
                return (
                  <img
                    src={url}
                    alt={`View ${currentIndex + 1}`}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  />
                )
              })()}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
