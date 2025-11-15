import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface HowItWorksStepProps {
  stepNumber: number;
  title: string;
  imageSrc: string;
  imagePosition: "left" | "right";
}

export const HowItWorksStep = ({ stepNumber, title, imageSrc, imagePosition }: HowItWorksStepProps) => {
  const [isInView, setIsInView] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      {
        threshold: 0.5,
        rootMargin: "-20% 0px -20% 0px"
      }
    );

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="mb-10">
      <div className={cn(
        "flex items-center gap-4",
        imagePosition === "right" && "flex-row-reverse"
      )}>
        {/* Image */}
        <div 
          ref={imageRef}
          className={cn(
            "flex-shrink-0 transition-transform duration-300 ease-out w-32",
            isInView && "md:scale-105"
          )}
        >
          <img 
            src={imageSrc} 
            alt={title}
            className="w-full h-auto object-contain"
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold text-base flex-shrink-0">
              {stepNumber}
            </div>
            <h3 className="text-base font-bold text-foreground leading-snug pt-0.5">{title}</h3>
          </div>
        </div>
      </div>
    </div>
  );
};
