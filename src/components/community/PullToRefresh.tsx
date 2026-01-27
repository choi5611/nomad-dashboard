import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, useAnimation, type PanInfo } from "framer-motion";
import { Loader2, RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const PULL_THRESHOLD = 80;

export default function PullToRefresh({ 
  onRefresh, 
  children, 
  className = "",
  disabled = false 
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const controls = useAnimation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setIsAtTop(scrollTop <= 0);
  }, []);

  const handleDrag = (_: any, info: PanInfo) => {
    if (isRefreshing || !isAtTop) return;
    
    // Only pull if we are dragging down from the top
    if (info.offset.y > 0) {
      // Resistance effect
      const distance = Math.min(info.offset.y * 0.4, PULL_THRESHOLD + 40);
      setPullDistance(distance);
    } else {
      setPullDistance(0);
    }
  };

  const handleDragEnd = async (_: any, info: PanInfo) => {
    if (isRefreshing || !isAtTop) return;

    if (info.offset.y * 0.4 >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      
      try {
        await onRefresh();
      } catch (err) {
        console.error("Refresh failed:", err);
      } finally {
        // Delay to show complete state
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
          controls.start({ y: 0 });
        }, 800);
      }
    } else {
      setPullDistance(0);
      controls.start({ y: 0 });
    }
  };

  useEffect(() => {
    if (!isRefreshing && pullDistance === 0) {
      controls.start({ y: 0 });
    } else {
      controls.start({ y: pullDistance });
    }
  }, [pullDistance, isRefreshing, controls]);

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      {/* Refresh Indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex justify-center items-center pointer-events-none z-[60]"
        style={{ 
          height: PULL_THRESHOLD,
          opacity: pullDistance / PULL_THRESHOLD,
          y: -PULL_THRESHOLD * 0.7 + pullDistance 
        }}
      >
        <div className="bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 p-2.5 rounded-full shadow-2xl shadow-cyan-500/40">
          {isRefreshing ? (
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
          ) : (
            <motion.div
              animate={{ rotate: (pullDistance / PULL_THRESHOLD) * 360 }}
              transition={{ duration: 0.1 }}
            >
              <RefreshCw className="w-5 h-5 text-cyan-400" />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Content Container */}
      <motion.div
        drag={!disabled && isAtTop ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="h-full w-full overflow-y-auto no-scrollbar touch-pan-y"
        onScroll={handleScroll}
        ref={scrollRef}
      >
        {children}
      </motion.div>
    </div>
  );
}
