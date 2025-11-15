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
    <div className="mb-12 md:mb-16">
      <div className={cn(
        "flex flex-col gap-6",
        "md:flex-row md:items-center md:gap-12",
        imagePosition === "right" && "md:flex-row-reverse"
      )}>
        {/* Image */}
        <div 
          ref={imageRef}
          className={cn(
            "flex-shrink-0 transition-transform duration-300 ease-out",
            "w-full md:w-1/2",
            isInView && "scale-105"
          )}
        >
          <img 
            src={imageSrc} 
            alt={title}
            className="w-full h-auto object-contain"
          />
        </div>

        {/* Content */}
        <div className="flex-1 md:w-1/2">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-xl flex-shrink-0">
              {stepNumber}
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-foreground leading-tight pt-1">{title}</h3>
          </div>
        </div>
      </div>
    </div>
  );
};
