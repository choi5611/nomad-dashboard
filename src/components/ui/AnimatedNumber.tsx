import { animate, useMotionValue, useTransform, motion } from "framer-motion";
import { useEffect } from "react";

interface AnimatedNumberProps {
  value: number;
  precision?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export default function AnimatedNumber({ 
  value, 
  precision = 0, 
  className,
  prefix = "",
  suffix = ""
}: AnimatedNumberProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    return latest.toFixed(precision);
  });

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1,
      ease: "easeOut",
    });
    return controls.stop;
  }, [value, count]);

  return (
    <motion.span className={className}>
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </motion.span>
  );
}
