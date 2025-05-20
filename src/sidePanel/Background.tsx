import { cn } from "@/src/background/util";
import { useConfig } from './ConfigContext';
import { personaImages } from "./constants";

export const Background = () => {
  const { config } = useConfig();
  const persona = config?.persona || 'default';
  const src = personaImages[persona] || personaImages.default;

  const containerClasses = cn(
    "flex",
    "items-center",
    "justify-center",
    "h-full",
    "fixed",
    "w-full",
    "top-[10%]",
    "pointer-events-none"
  );

  const imageClasses = cn(
    "fixed",
    "opacity-[0.03]",
    "z-[1]"
  );

  return (
    <div className={containerClasses}>
      <img
        src={src}
        alt=""
        className={imageClasses}
        style={{
          zoom: '1.2',
        }}
      />
    </div>
  );
};