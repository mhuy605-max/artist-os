import logoAsset from "@/assets/darkroom-logo.png.asset.json";
import { cn } from "@/lib/utils";

/**
 * Official DARKROOM SYSTEM logo. Used as-is: transparent, monochrome,
 * original aspect ratio preserved (never redrawn, recoloured or cropped).
 */
export function Logo({ className }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="DARKROOM SYSTEM"
      className={cn("h-auto w-full select-none object-contain", className)}
      draggable={false}
    />
  );
}
