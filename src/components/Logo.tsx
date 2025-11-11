import logoImage from "@/assets/logo.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8",
  md: "h-12",
  lg: "h-16",
};

export const Logo = ({ className = "", size = "md" }: LogoProps) => {
  return (
    <img 
      src={logoImage} 
      alt="LAZO" 
      className={`${sizeClasses[size]} w-auto ${className}`}
    />
  );
};
