import {
  AccordionItem,
  AccordionContent,
  AccordionTrigger,
} from '@/components/ui/accordion';
// Button might not be needed anymore unless used for something else
// import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Switch } from "@/components/ui/switch"; // Import Switch
import { useConfig } from './ConfigContext';
import { SettingTitle } from './SettingsTitle';
import { useState, useEffect, useCallback } from 'react';
import { Config } from '../types/config';
import storage from '../background/storageUtil';
import { ColorPicker, useColor, IColor } from 'react-color-palette';
import 'react-color-palette/css';
import { cn } from "@/src/background/util";

// Theme type definition (remains the same)
export type Theme = {
  name: string;
  active: string;
  bg: string;
  text: string;
  bold: string;
  italic: string;
  link: string;
  codeBg: string;
  codeFg: string;
  preBg: string;
  mute: string; // Added for dedicated muted text color
  preFg: string;
  tableBorder: string;
  error: string;
  success: string;
  warning: string;
};

// themes array (remains the same)
export const themes: Theme[] = [
  {
    name: 'paper',
    active: '#dcc299',
    bg: '#F5E9D5',
    text: '#5B4636',
    bold: '#af1b1b',
    italic: '#036427',
    link: '#003bb9',
    codeBg: '#5B4636',
    codeFg: '#F5E9D5',
    preBg: '#5B4636',
    preFg: '#F5E9D5',
    mute: '#A08C7D', // Lighter brown
    tableBorder: '#5B4636',
    error: '#d32f2f',
    success: '#388e3c',
    warning: '#fbc02d',
  },
  {
    name: 'smoke',
    active: '#939393',
    bg: '#dfdfdf',
    text: '#000000',
    bold: '#eafadb',
    italic: '#fbe1cf',
    link: '#c3d5fa',
    codeBg: '#333333',
    codeFg: '#dfdfdf',
    preBg: '#333333',
    preFg: '#dfdfdf',
    mute: '#757575', // Mid-gray
    tableBorder: '#333333',
    error: '#d32f2f',
    success: '#388e3c',
    warning: '#fbc02d',
  },
  {
    name: 'moss',
    active: '#a4b086',
    bg: '#EFD6AC',
    text: '#333333',
    bold: '#af1b1b',
    italic: '#6349b3',
    link: '#4367b6',
    codeBg: '#333333',
    codeFg: '#EFD6AC',
    preBg: '#333333',
    preFg: '#EFD6AC',
    mute: '#7F7F7F', // Mid-dark gray
    tableBorder: '#6349b3',
    error: '#d32f2f',
    success: '#388e3c',
    warning: '#fbc02d',
  },
  {
    name: 'dark',
    active: '#7473af',
    bg: '#373737',
    text: '#e3e3e3',
    bold: '#eb9500',
    italic: '#97e9b5',
    link: '#8aa8e8',
    codeBg: '#e3e3e3',
    codeFg: '#373737',
    preBg: '#e3e3e3',
    preFg: '#373737',
    mute: '#A9A9A9', // Lighter gray for dark themes
    tableBorder: '#e3e3e3',
    error: '#d32f2f',
    success: '#388e3c',
    warning: '#fbc02d',
  },
  {
    name: 'custom', // Base for custom theme
    active: '#7473af', bg: '#393939', text: '#e3e3e3', bold: '#af1b1b',
    italic: '#09993e', link: '#003bb9', codeBg: '#e3e3e3', codeFg: '#393939',
    preBg: '#e3e3e3', preFg: '#393939', mute: '#A9A9A9', tableBorder: '#e3e3e3',
    error: '#d32f2f', success: '#388e3c', warning: '#fbc02d',
  },
];

// setTheme function (remains the same)
export const setTheme = (c: Theme, paperTextureEnabled: boolean = true) => {
  const root = document.documentElement;
  document.documentElement.dataset.paperTexture = String(paperTextureEnabled);
  if (c && c.name) {
    // Storing the active theme name might still be useful for persistence
    // storage.setItem('themeName', c.name); // Example if you stored it separately
  }

  if (!c) {
    console.error("setTheme called with undefined theme object");
    return;
  }

  const bg = c.bg || '#ffffff';
  const text = c.text || '#000000';
  const active = c.active || '#007bff';
  const bold = c.bold || '#000000';
  const italic = c.italic || '#000000';
  const link = c.link || '#007bff';
  const codeBg = c.codeBg || text; // For --markdown-code-background (inline code bg) & --muted
  const codeFg = c.codeFg || bg;   // For --markdown-inline-code-foreground & --muted-foreground
  const preBg = c.preBg || text;   // For --markdown-pre-background (block code bg)
  const preFg = c.preFg || bg;     // For --markdown-pre-foreground (block code fg)
  const mute = c.mute || (text === '#000000' ? '#757575' : '#A9A9A9'); // Fallback based on typical text color
  const tableBorder = c.tableBorder || text;
  const errorColor = c.error || '#d32f2f';
  const successColor = c.success || '#388e3c';
  const warningColor = c.warning || '#fbc02d';

  root.style.setProperty('--background', bg);
  root.style.setProperty('--foreground', text);
  root.style.setProperty('--card', bg);
  root.style.setProperty('--card-foreground', text);
  root.style.setProperty('--popover', bg);
  root.style.setProperty('--popover-foreground', text);
  root.style.setProperty('--primary', active);
  root.style.setProperty('--primary-foreground', bg);
  root.style.setProperty('--secondary', active);
  root.style.setProperty('--secondary-foreground', bg);
  root.style.setProperty('--muted', codeBg); // Use inline code's bg for muted
  root.style.setProperty('--muted-foreground', mute); // CORRECTED: Use dedicated mute
  root.style.setProperty('--accent', active);
  root.style.setProperty('--accent-foreground', bg);
  root.style.setProperty('--destructive', errorColor);
  root.style.setProperty('--destructive-foreground', bg); // Assuming errorColor contrasts with bg
  root.style.setProperty('--border', text);
  root.style.setProperty('--input', text);
  root.style.setProperty('--ring', active);

  root.style.setProperty('--markdown-h1', bold);
  root.style.setProperty('--markdown-h2', italic);
  root.style.setProperty('--markdown-h3', text);
  root.style.setProperty('--markdown-strong', bold);
  root.style.setProperty('--markdown-em', italic);
  root.style.setProperty('--markdown-link', link);
  // Corrected markdown code variable names
  root.style.setProperty('--markdown-inline-code-foreground', codeFg);
  root.style.setProperty('--markdown-code-background', codeBg);
  root.style.setProperty('--markdown-pre-foreground', preFg);
  root.style.setProperty('--markdown-pre-background', preBg);
  root.style.setProperty('--markdown-table-border', tableBorder);
  // Added markdown table head variables
  root.style.setProperty('--markdown-thead-background', active); // Using active (like secondary)
  root.style.setProperty('--markdown-thead-foreground', bg);     // Contrast with active

  root.style.setProperty('--bold', bold);
  root.style.setProperty('--italic', italic);
  root.style.setProperty('--link', link);
  root.style.setProperty('--error', errorColor);
  root.style.setProperty('--success', successColor);
  root.style.setProperty('--warning', warningColor);
  root.style.setProperty('--bg', bg);
  root.style.setProperty('--text', text);
  root.style.setProperty('--active', active);
};

// themes.tsx

// ... (other code like Theme type, themes array, setTheme function) ...

const PaletteColorPicker = ({
  initialColor,
  onColorChangeComplete,
  themeKey,
}: {
  initialColor: string;
  onColorChangeComplete: (key: keyof Omit<Theme, 'name'>, color: IColor) => void;
  themeKey: keyof Omit<Theme, 'name'>;
}) => {
  let safeInitialColor = initialColor;
  if (typeof initialColor !== 'string' || !initialColor.match(/^#([0-9a-f]{3}){1,2}$/i)) {
     console.error(`PaletteColorPicker received invalid initialColor: "${initialColor}" for key: ${themeKey}. Using fallback #FF00FF.`);
     safeInitialColor = '#FF00FF';
  }
  const [color, setColor] = useColor(safeInitialColor);

  return (
    <ColorPicker
      color={color} // This is the state from useColor
      onChange={(newColor) => {
        // THIS IS THE KEY LOG: Does this fire when you try to drag/click on the palette?
        console.log(`PaletteColorPicker INTERNAL onChange for key "${themeKey}":`, newColor.hex);
        setColor(newColor); // This updates the local state for the picker itself
      }}
      onChangeComplete={(finalColor) => {
        // This should fire when you release the mouse after dragging, or after a click selection.
        console.log(`PaletteColorPicker INTERNAL onChangeComplete for key "${themeKey}":`, finalColor.hex);
        onColorChangeComplete(themeKey, finalColor); // This calls the function passed from Themes component
      }}
      hideInput={["rgb", "hsv"]}
    />
  );
};

// DEFAULT_CUSTOM_THEME_FALLBACK (remains the same, ensure all keys are present)
const DEFAULT_CUSTOM_THEME_FALLBACK: Theme = {
  name: 'custom',
  active: '#b5d4aa', bg: '#245612', text: '#efeaea', bold: '#fbd709',
  italic: '#09993e', link: '#587bc5', mute: '#B0B0B0', codeBg: '#efeaea', codeFg: '#245612',
  preBg: '#efeaea', preFg: '#245612', tableBorder: '#efeaea',
  error: '#fbd709', success: '#587bc5', warning: '#fbd709',
};

// No longer need CustomThemePicker or ThemeButton components here

export const Themes = () => {
  // ... (config, updateConfig, states like pickerVisibleForKey, customThemeColors) ...
  const { config, updateConfig } = useConfig();
  const currentFontSize = config?.fontSize || 14;
  const isDark = config?.theme === 'dark';

  const subtleBorderClass = 'border-[var(--text)]/10';
  const controlBg = isDark ? 'bg-[rgba(255,255,255,0.04)]' : 'bg-[rgba(255,250,240,0.6)]';
  const itemShadow = 'shadow-md';
  const itemRounded = 'rounded-xl';
  
  const [pickerVisibleForKey, setPickerVisibleForKey] = useState<keyof Omit<Theme, 'name'> | null>(null);
  const [customThemeColors, setCustomThemeColors] = useState<Omit<Theme, 'name'>>(() => { /* ...initialization logic... */
    const baseDefault = themes.find((t) => t.name === 'custom') || DEFAULT_CUSTOM_THEME_FALLBACK;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { name, ...restOfBaseDefault } = baseDefault;

    const configCustom = (typeof config?.customTheme === 'object' && config.customTheme !== null)
      ? config.customTheme
      : {};
    
    const mergedInitialState: Omit<Theme, 'name'> = {
        bg: configCustom.bg ?? restOfBaseDefault.bg,
        text: configCustom.text ?? restOfBaseDefault.text,
        active: configCustom.active ?? restOfBaseDefault.active,
        bold: configCustom.bold ?? restOfBaseDefault.bold,
        italic: configCustom.italic ?? restOfBaseDefault.italic,
        link: configCustom.link ?? restOfBaseDefault.link,
        codeBg: configCustom.codeBg ?? restOfBaseDefault.codeBg,
        codeFg: configCustom.codeFg ?? restOfBaseDefault.codeFg,
        preBg: configCustom.preBg ?? restOfBaseDefault.preBg,
        mute: configCustom.mute ?? restOfBaseDefault.mute,
        preFg: configCustom.preFg ?? restOfBaseDefault.preFg,
        tableBorder: configCustom.tableBorder ?? restOfBaseDefault.tableBorder,
        error: configCustom.error ?? restOfBaseDefault.error,
        success: configCustom.success ?? restOfBaseDefault.success,
        warning: configCustom.warning ?? restOfBaseDefault.warning,
    };
    return mergedInitialState;
  });

  useEffect(() => { /* ... sync logic ... */
    if (config?.theme === 'custom') {
      const configCustom = (typeof config?.customTheme === 'object' && config.customTheme !== null)
        ? config.customTheme
        : {};
      const baseDefault = themes.find((t) => t.name === 'custom') || DEFAULT_CUSTOM_THEME_FALLBACK;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { name, ...restOfBaseDefault } = baseDefault;
      const newCustomColorsCandidate: Omit<Theme, 'name'> = {
        bg: configCustom.bg ?? restOfBaseDefault.bg,
        text: configCustom.text ?? restOfBaseDefault.text,
        active: configCustom.active ?? restOfBaseDefault.active,
        bold: configCustom.bold ?? restOfBaseDefault.bold,
        italic: configCustom.italic ?? restOfBaseDefault.italic,
        link: configCustom.link ?? restOfBaseDefault.link,
        codeBg: configCustom.codeBg ?? restOfBaseDefault.codeBg,
        codeFg: configCustom.codeFg ?? restOfBaseDefault.codeFg,
        preBg: configCustom.preBg ?? restOfBaseDefault.preBg,
        mute: configCustom.mute ?? restOfBaseDefault.mute,
        preFg: configCustom.preFg ?? restOfBaseDefault.preFg,
        tableBorder: configCustom.tableBorder ?? restOfBaseDefault.tableBorder,
        error: configCustom.error ?? restOfBaseDefault.error,
        success: configCustom.success ?? restOfBaseDefault.success,
        warning: configCustom.warning ?? restOfBaseDefault.warning,
      };
      if (JSON.stringify(customThemeColors) !== JSON.stringify(newCustomColorsCandidate)) {
        setCustomThemeColors(newCustomColorsCandidate);
      }
    }
  }, [config?.customTheme, config?.theme, customThemeColors]); // Added customThemeColors back to ensure re-check if it's modified externally, though unlikely here.

  const handleColorChange = useCallback((key: keyof Omit<Theme, 'name'>, colorResult: IColor) => {
    // Log when this function (passed to PaletteColorPicker) is called
    console.log(`Themes: handleColorChange called for key "${key}" with color`, colorResult.hex);
    const value = colorResult.hex;

    setCustomThemeColors(prevCustomColors => {
      let newThemeData = { ...prevCustomColors, [key]: value };
      // ... (cascading logic)
      if (key === 'text') {
        newThemeData.codeBg = value; newThemeData.preBg = value; newThemeData.tableBorder = value;
        newThemeData.error = newThemeData.bold || value; newThemeData.warning = newThemeData.bold || value;
        if (prevCustomColors.bg) { newThemeData.codeFg = prevCustomColors.bg; newThemeData.preFg = prevCustomColors.bg; }
        if (prevCustomColors.link) newThemeData.success = prevCustomColors.link;
      } else if (key === 'bg') {
        newThemeData.codeFg = value; newThemeData.preFg = value;
        if (prevCustomColors.text) { newThemeData.codeBg = prevCustomColors.text; newThemeData.preBg = prevCustomColors.text; }
      } else if (key === 'bold') {
        newThemeData.error = value; newThemeData.warning = value;
      } else if (key === 'link') {
        newThemeData.success = value;
      }
      
      console.log("Themes: Updating config with new customTheme and setting theme to 'custom'", newThemeData);
      updateConfig({
        customTheme: newThemeData,
        theme: 'custom',
      });
      return newThemeData;
    });
  }, [updateConfig]); // Removed customThemeColors from deps, using functional update for setCustomThemeColors

  // ... (editableColorKeys, effectiveCustomThemeForPickers, main useEffect for theme application) ...
  const editableColorKeys: Array<keyof Omit<Theme, 'name'>> = ['bg', 'text', 'active', 'bold', 'italic', 'link', 'mute'];
  const effectiveCustomThemeForPickers: Theme = { ...customThemeColors, name: 'custom' };

  useEffect(() => { /* ... theme application logic ... */
    const currentThemeName = config?.theme || 'paper';
    const isCustom = currentThemeName === 'custom';
    let themeToApply: Theme | undefined;

    if (isCustom) {
      const baseCustomDefinition = themes.find((t) => t.name === 'custom') || DEFAULT_CUSTOM_THEME_FALLBACK;
      themeToApply = {
        ...baseCustomDefinition,
        ...customThemeColors,   
        name: 'custom',         
      };
    } else {
      themeToApply = themes.find((t) => t.name === currentThemeName) || themes.find((t) => t.name === 'paper');
    }

    if (themeToApply) {
      setTheme(themeToApply, config?.paperTexture ?? true);
    } else {
      console.warn(`Themes: No theme definition found for "${currentThemeName}". Applying fallback.`);
      setTheme(DEFAULT_CUSTOM_THEME_FALLBACK, config?.paperTexture ?? true);
    }
    if (config?.fontSize) {
      document.documentElement.style.setProperty('--global-font-size', `${config.fontSize}px`);
    }
  }, [config?.theme, customThemeColors, config?.paperTexture, config?.fontSize]);


  // ... (JSX for AccordionItem, toggles, slider) ...
  return (
    <AccordionItem
      value="themes" // This value should match the one used in the parent Accordion
      className={cn(
        controlBg, subtleBorderClass, itemRounded, itemShadow,
        "transition-all duration-150 ease-in-out",
        "hover:border-[var(--active)] hover:brightness-105"
      )}
    >
      <AccordionTrigger
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 hover:no-underline",
          "text-[var(--text)] font-medium",
          "hover:brightness-95",
          "data-[state=open]:border-b data-[state=open]:border-[var(--text)]/5"
        )}
      >
        {/* Updated title to reflect its content better */}
        <SettingTitle icon="🖌️" text="Customize" />
      </AccordionTrigger>
      <AccordionContent className="px-3 pb-4 pt-2 text-[var(--text)]">
        <div className="flex flex-col gap-6">
          {/* Settings Toggles */}
          <div className="flex flex-col gap-3">
            {/* Create chat title */}
            <div className="flex items-center justify-between pr-3">
              <Label htmlFor="generateTitle-switch" className="text-base font-medium text-foreground cursor-pointer">Create chat title</Label>
              <Switch
                id="generateTitle-switch"
                checked={config?.generateTitle ?? false}
                onCheckedChange={(checked) => updateConfig({ generateTitle: checked })}
              />
            </div>
            {/* Background illustration */}
            <div className="flex items-center justify-between pr-3">
              <Label htmlFor="backgroundImage-switch" className="text-base font-medium text-foreground cursor-pointer">Background illustration</Label>
              <Switch
                id="backgroundImage-switch"
                checked={config?.backgroundImage ?? false}
                onCheckedChange={(checked) => updateConfig({ backgroundImage: checked })}
              />
            </div>
            {/* Paper texture */}
            <div className="flex items-center justify-between pr-3">
              <Label htmlFor="paperTexture-switch" className="text-base font-medium text-foreground cursor-pointer">Paper texture</Label>
              <Switch
                id="paperTexture-switch"
                checked={config?.paperTexture ?? true}
                onCheckedChange={(checked) => updateConfig({ paperTexture: checked })}
              />
            </div>
          </div>

          {/* Font Size Slider */}
          <div>
            <p className="text-foreground text-base font-medium pb-3 text-left">Font Size: {currentFontSize}px</p>
            <Slider value={[currentFontSize]} max={20} min={7} step={1} className="w-full" onValueChange={(value) => { updateConfig({ fontSize: value[0] }); }} />
          </div>

          {/* Custom Theme Color Editor Section */}
          <div className="pt-4 mt-4 border-t border-[var(--text)]/20">
            <div className="space-y-2 mb-4">
              <h4 className="font-medium leading-none text-foreground">Custom Theme Colors</h4>
              <p className="text-sm text-muted-foreground">Modify colors for your 'custom' theme. Selecting a color will automatically apply the custom theme.</p>
            </div>
            <div className="space-y-3">
              {editableColorKeys.map((key) => {
                const colorValue = effectiveCustomThemeForPickers[key];
                const isValidHex = typeof colorValue === 'string' && !!colorValue.match(/^#([0-9a-f]{3}){1,2}$/i);

                if (!isValidHex) {
                  console.error(`Themes UI: Invalid color value for key "${key}":`, colorValue);
                  return ( <div key={key} className="flex items-center justify-between p-2 text-red-500 bg-red-100 rounded-md"> <Label className="capitalize text-sm font-medium text-red-600">{key}</Label> <span>Error: Invalid color data ("{String(colorValue)}")</span> </div> );
                }

                return (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="capitalize text-sm font-medium text-foreground">{key}</Label>
                    <Popover open={pickerVisibleForKey === key} onOpenChange={(isOpen) => { setPickerVisibleForKey(isOpen ? key : null); }} >
                      <PopoverTrigger asChild>
                        <button className="w-20 h-8 border border-border rounded-sm cursor-pointer hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" style={{ backgroundColor: colorValue }} aria-label={`Pick color for ${key}: ${colorValue}`} onClick={() => setPickerVisibleForKey(pickerVisibleForKey === key ? null : key)} />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover border border-border shadow-lg z-[51]" side="right" align="start" sideOffset={10} onOpenAutoFocus={(e) => e.preventDefault()} >
                        {pickerVisibleForKey === key && (
                          <PaletteColorPicker key={`${key}-${colorValue}`} initialColor={colorValue} onColorChangeComplete={handleColorChange} themeKey={key} />
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};