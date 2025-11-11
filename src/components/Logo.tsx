import logoLazo from "@/assets/logo-lazo.png";

interface LogoProps {
  className?: string;
}

export const Logo = ({ className = "" }: LogoProps) => {
  return (
    <div className={`flex justify-center ${className}`}>
      <img 
        src={logoLazo} 
        alt="Logo LAZO" 
        className="w-auto h-12 max-w-[140px] object-contain"
      />
    </div>
  );
};
