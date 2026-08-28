import { cn } from "@/lib/utils";
import { SONG_STATUS_LABELS, type SongStatus } from "@/types";

/**
 * Monochrome status marker. Differentiation is carried by glyph, border,
 * fill and opacity — never by colour.
 */
const GLYPH: Record<string, string> = {
  Idea: "○",
  Demo: "○",
  Recording: "◐",
  Mixing: "●",
  Mastering: "◉",
  ReleasePreparation: "◈",
  ContentCampaign: "◇",
  Released: "✓",
  Analytics: "▤",
  // asset / content states
  Missing: "×",
  "In Progress": "◐",
  Review: "◍",
  Approved: "✓",
  Final: "✓",
  Draft: "○",
  Current: "●",
  Planning: "○",
  Preparing: "◐",
  Ready: "◉",
  Scheduled: "◈",
  Planned: "○",
  "In Production": "◐",
  Editing: "◍",
  Published: "✓",
  Confirmed: "✓",
  Pending: "◐",
  Invited: "○",
};

const STRONG = new Set([
  "Released",
  "Approved",
  "Final",
  "Current",
  "Published",
  "Confirmed",
  "Ready",
]);
const QUIET = new Set(["Idea", "Demo", "Missing", "Draft", "Planning", "Planned", "Invited"]);

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({ status, size = "sm", className }: StatusBadgeProps) {
  const label = SONG_STATUS_LABELS[status as SongStatus] ?? status;
  const glyph = GLYPH[status] ?? "•";
  const strong = STRONG.has(status);
  const quiet = QUIET.has(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border font-mono uppercase tracking-[0.14em] whitespace-nowrap",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[11px]",
        strong && "border-foreground bg-foreground font-medium text-background",
        !strong && !quiet && "border-border-strong bg-panel-strong text-foreground",
        quiet && "border-border bg-transparent text-subtle",
        className,
      )}
    >
      <span aria-hidden className="text-[0.85em] leading-none">
        {glyph}
      </span>
      {label}
    </span>
  );
}
