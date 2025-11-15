import logoLazo from "@/assets/logo-lazo.png";
interface LogoProps {
  className?: string;
}
export const Logo = ({
  className = ""
}: LogoProps) => {
  return <div className={`flex justify-center ${className}`}>
      
    </div>;
};