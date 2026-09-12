import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  googleDriveApi,
  googleDriveConnectionQueryKey,
  openGoogleAuthorizationUrl,
  type GoogleDriveConnectionStatus,
} from "@/services/api/googleDrive";

import { AppShell } from "../AppShell";
import { PageHeader, Panel, formatDate } from "../Primitives";
import { StatusBadge } from "../StatusBadge";

function FileRow({
  title,
  meta,
  status,
  detail,
}: {
  title: string;
  meta: string;
  status: string;
  detail?: string;
}) {
  return (
    <div className="border border-border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      {detail ? <p className="mt-3 text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

export function SettingsPage() {
  const queryClient = useQueryClient();
  const googleDriveQuery = useQuery({
    queryKey: googleDriveConnectionQueryKey,
    queryFn: googleDriveApi.getStatus,
  });

  const connectMutation = useMutation({
    mutationFn: googleDriveApi.connect,
    onSuccess: (response) => {
      openGoogleAuthorizationUrl(response.authorizationUrl);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: googleDriveApi.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: googleDriveConnectionQueryKey });
    },
  });

  return (
    <AppShell>
      <PageHeader eyebrow="Settings" title="Workspace controls" />
      <div className="grid gap-4 lg:grid-cols-2">
        {["Profile", "Workspace", "Notifications", "Appearance"].map((section) => (
          <Panel key={section} title={section} label="Frontend-only">
            <p className="text-sm text-muted-foreground">
              Expanded workspace controls remain planned for a later DARKROOM SYSTEM milestone.
            </p>
          </Panel>
        ))}
        <Panel title="Integrations" label="Connections" className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <GoogleDriveIntegrationCard
              connection={googleDriveQuery.data}
              isLoading={googleDriveQuery.isLoading}
              error={googleDriveQuery.error}
              isConnecting={connectMutation.isPending}
              isDisconnecting={disconnectMutation.isPending}
              onConnect={() => connectMutation.mutate()}
              onDisconnect={() => disconnectMutation.mutate()}
            />
            <FileRow
              title="YouTube"
              meta="Performance analytics provider"
              status="Not Connected"
              detail="Coming later"
            />
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function GoogleDriveIntegrationCard({
  connection,
  isLoading,
  error,
  isConnecting,
  isDisconnecting,
  onConnect,
  onDisconnect,
}: {
  connection?: GoogleDriveConnectionStatus;
  isLoading: boolean;
  error: unknown;
  isConnecting: boolean;
  isDisconnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const connected = connection?.connected === true;
  const needsAttention = connection?.status === "ReauthRequired";
  const title = "Google Drive";
  const status = needsAttention
    ? "Connection needs attention"
    : connected
      ? "Connected"
      : "Not connected";
  const detail = connected
    ? `Connected ${formatDate(connection.connectedAt ?? "")}`
    : needsAttention
      ? "Reconnect to restore backend access."
      : "Connect media storage access.";
  const actionLabel = needsAttention ? "Reconnect" : connected ? "Disconnect" : "Connect";
  const busy = isConnecting || isDisconnecting;

  return (
    <div className="border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="label-tech">{title}</p>
          <p className="mt-2 text-sm text-muted-foreground">Media storage provider</p>
        </div>
        <span
          className={cn(
            "shrink-0 border px-2 py-1 text-[10px] uppercase",
            connected && !needsAttention
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground",
          )}
        >
          {isLoading ? "Checking" : status}
        </span>
      </div>

      <div className="mt-5 space-y-2">
        <p className="truncate text-sm font-medium">
          {connected || needsAttention ? connection?.email : "Not connected"}
        </p>
        <p className="text-xs uppercase text-muted-foreground">{isLoading ? "Loading" : detail}</p>
        {error ? (
          <p className="text-xs uppercase text-destructive">Google Drive status did not load.</p>
        ) : null}
      </div>

      <div className="mt-5">
        <Button
          variant={connected && !needsAttention ? "outline" : "default"}
          onClick={connected && !needsAttention ? onDisconnect : onConnect}
          disabled={busy || isLoading}
        >
          {busy ? "Working" : actionLabel}
        </Button>
      </div>
    </div>
  );
}
