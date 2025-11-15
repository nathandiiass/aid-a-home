import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
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
    <Card className="p-6 bg-card border border-border shadow-subtle mb-6">
      <div className={cn(
        "flex flex-col gap-4",
        "md:flex-row md:items-center md:gap-8",
        imagePosition === "right" && "md:flex-row-reverse"
      )}>
        {/* Image */}
        <div 
          ref={imageRef}
          className={cn(
            "flex-shrink-0 transition-transform duration-300 ease-out",
            isInView && "scale-105"
          )}
        >
          <img 
            src={imageSrc} 
            alt={title}
            className="w-full md:w-48 h-auto object-contain"
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-lg">
              {stepNumber}
            </div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          </div>
        </div>
      </div>
    </Card>
  );
};
