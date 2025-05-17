import { cn } from "@/src/background/util";
import { useConfig } from './ConfigContext';

const personaImages: {
  Agatha: string;
  Spike: string;
  Warren: string;
  Jet: string;
  Jan: string;
  Sherlock: string;
  Ein: string;
  Faye: string;
  default: string;
  [key: string]: string | undefined;
} = {  Agatha: 'assets/images/agatha.png',
  Spike: 'assets/images/spike.png',
  Warren: 'assets/images/warren.png',
  Jet: 'assets/images/jet.png',
  Jan: 'assets/images/jan.png',
  Sherlock: 'assets/images/Cognito.png',
  Ein: 'assets/images/ein.png',
  Faye:'assets/images/faye.png',
  default: 'assets/images/custom.png'
};

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