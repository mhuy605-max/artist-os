import { AlertTriangle, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="label-tech">{eyebrow}</p>
        <h1 className="mt-3 display-xl uppercase">{title}</h1>
      </div>
      {children}
    </header>
  );
}

export function Panel({
  title,
  label,
  children,
  className,
}: {
  title?: string;
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel-surface p-4", className)}>
      {title || label ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {label ? <p className="label-tech">{label}</p> : null}
            {title ? <h2 className="mt-2 text-sm font-semibold uppercase">{title}</h2> : null}
          </div>
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center border border-dashed border-border p-6 text-center">
      <p className="text-sm font-medium uppercase">{title}</p>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-36 items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({
  title = "This area did not load",
  detail,
  onRetry,
}: {
  title?: string;
  detail: string;
  onRetry?: () => void;
}) {
  return (
    <div className="border border-border-strong bg-panel p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 text-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium uppercase">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
          {onRetry ? (
            <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function MetricBlock({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="border border-border bg-background p-4">
      <p className="label-tech">{label}</p>
      <p className="mt-3 text-2xl font-semibold uppercase">{value}</p>
      {detail ? <p className="mt-2 text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

export function MiniBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);

  return (
    <div className="flex h-28 items-end gap-2 border border-border bg-background p-3">
      {values.map((value, index) => (
        <div
          key={`${value}-${index}`}
          className="min-w-0 flex-1 bg-foreground"
          style={{
            height: `${Math.max(8, (value / max) * 100)}%`,
            opacity: 0.25 + value / max / 1.5,
          }}
        />
      ))}
    </div>
  );
}

export function formatDate(value?: string) {
  if (!value || value === "Not scheduled" || value === "-" || value === "—") return value ?? "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(value);
}
