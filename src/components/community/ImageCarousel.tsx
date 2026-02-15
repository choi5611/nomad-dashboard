import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Layers, Maximize2 } from "lucide-react"
import { useState } from "react"
import ImageViewer from "./ImageViewer"

interface ImageCarouselProps {
  images: string[]
  page: number
  direction: number
  currentImageIndex: number
  hasMultipleImages: boolean
  onPaginate: (newDirection: number) => void
}

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0
  })
}

export default function ImageCarousel({
  images,
  page,
  direction,
  currentImageIndex,
  hasMultipleImages,
  onPaginate
}: ImageCarouselProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false)

  if (images.length === 0) return null

  return (
    <>
      <div 
        className="relative mb-3 group select-none h-[300px] cursor-pointer"
        onClick={() => setIsViewerOpen(true)}
      >
        <div className="w-full h-full rounded-lg overflow-hidden bg-black/20 relative">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={page}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="absolute inset-0 w-full h-full"
            >
              {(() => {
                const url = images[currentImageIndex]
                const isVideo = url.toLowerCase().match(/\.(mp4|mov|webm|ogv|m4v)/) || url.includes('/post-videos/')

                if (isVideo) {
                  return (
                    <div className="w-full h-full flex items-center justify-center bg-black">
                      <video
                        src={url}
                        className="w-full h-full object-cover"
                        controls={false}
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    </div>
                  )
                }
                return (
                  <img
                    src={url}
                    alt={`post-image-${currentImageIndex}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )
              })()}
            </motion.div>
          </AnimatePresence>
          
          {/* Hover Overlay Hint */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 z-20 pointer-events-none">
            <Maximize2 className="w-8 h-8 text-white/50 drop-shadow-lg scale-90 group-hover:scale-100 transition-transform" />
          </div>
        </div>

        {/* Navigation Buttons */}
        {hasMultipleImages && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onPaginate(-1); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white/90 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity z-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onPaginate(1); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white/90 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity z-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-30 pointer-events-none">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all box-shadow-sm ${
                    currentImageIndex === idx ? "bg-white scale-125" : "bg-white/40"
                  }`}
                />
              ))}
            </div>

            {/* Image Counter Badge */}
            <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/60 text-white text-xs font-medium flex items-center gap-1 backdrop-blur-sm z-30 pointer-events-none">
              <Layers className="w-3 h-3" />
              {currentImageIndex + 1}/{images.length}
            </div>
          </>
        )}
      </div>

      <ImageViewer
        images={images}
        initialIndex={currentImageIndex}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
      />
    </>
  )
}
