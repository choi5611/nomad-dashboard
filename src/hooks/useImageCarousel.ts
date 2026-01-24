import { useState } from "react"

export function useImageCarousel(imageCount: number) {
  const [[page, direction], setPage] = useState([0, 0])

  const currentImageIndex = Math.abs(page % imageCount)
  const hasMultipleImages = imageCount > 1

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection])
  }

  return {
    page,
    direction,
    currentImageIndex,
    hasMultipleImages,
    paginate
  }
}
