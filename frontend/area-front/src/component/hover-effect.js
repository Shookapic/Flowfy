import { cn } from "../lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState } from "react";

export const HoverEffect = ({
  items,
  className
}) => {
  let [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-10", className)}>
      {items.map((item, idx) => (
        <Link
          to={item?.link}
          key={item?.link}
          className="relative group block p-2 h-full w-full"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}>
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className="absolute inset-0 h-full w-full bg-neutral-200 dark:bg-slate-800/[0.8] block rounded-3xl"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.15 },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15, delay: 0.2 },
                }} />
            )}
          </AnimatePresence>
          <Card bgColor={item.bgColor}>
            <CardLogo src={item.logo} alt={item.title} scale={item.scale} />
            <CardDescription textColor={item.textColor}>{item.description}</CardDescription>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export const Card = ({
  className,
  children,
  bgColor
}) => {
  return (
    <div
      className={cn(
        "relative rounded-2xl h-64 w-full p-4 overflow-hidden border border-transparent dark:border-white/[0.2] group-hover:border-slate-700 flex flex-col items-center justify-center",
        className
      )}
      style={{ backgroundColor: bgColor }}>
      {children}
    </div>
  );
};

export const CardLogo = ({
  className,
  src,
  alt,
  scale
}) => {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
      <img
        className={cn("mb-4", className)}
        src={src}
        alt={alt}
        style={{ transform: `scale(${scale})` }}
      />
    </div>
  );
};

export const CardDescription = ({
  className,
  children,
  textColor
}) => {
  return (
    <p
      className={cn("absolute bottom-10 text-zinc-400 tracking-wide leading-relaxed text-lg font-bold text-center", className)}
      style={{ color: textColor }}>
      {children}
    </p>
  );
};