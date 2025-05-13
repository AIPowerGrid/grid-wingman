import { cn } from "@/src/background/util";
import { useConfig } from './ConfigContext'; // Assuming this path is correct

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

  // Use cn utility, although no conditional classes are needed here yet
  const containerClasses = cn(
    "flex",           // display="flex"
    "items-center",   // alignItems="center"
    "justify-center", // justifyContent="center"
    "h-full",       // height="80vh" (using arbitrary value syntax)
    "fixed",          // style: position: 'fixed'
    "w-full",         // style: width: '100%'
    "top-[10%]",      // style: top: '10%' (using arbitrary value syntax)
    "pointer-events-none" // style: pointerEvents: 'none'
  );

  const imageClasses = cn(
    "fixed",          // style: position: 'fixed'
    "opacity-[0.03]", // style: filter: 'opacity(0.03)' (using arbitrary value syntax for exact match)
    // Alternatively use opacity-5 for a close standard value: "opacity-5"
    "z-[1]"           // style: zIndex: 1 (using arbitrary value syntax for exact match)
    // Note: Tailwind's z-index scale starts at 10 (z-10), so z-[1] is needed for 1.
  );

  return (
    <div className={containerClasses}>
      <img
        src={src}
        alt="" // Add alt attribute for accessibility, even if empty
        className={imageClasses}
        style={{
          zoom: '1.2', // Keep zoom as inline style as there's no direct Tailwind equivalent
        }}
      />
    </div>
  );
};