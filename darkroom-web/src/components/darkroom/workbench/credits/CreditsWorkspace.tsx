import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FolderTree,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useId, useMemo, useState, type FormEvent, type ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "@/components/darkroom/AppShell";
import { Logo } from "@/components/darkroom/Logo";
import { StatusBadge } from "@/components/darkroom/StatusBadge";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  MetricBlock,
  PageHeader,
  Panel,
  formatDate,
  formatNumber,
} from "@/components/darkroom/Primitives";
import { analyticsApi } from "@/services/api/analytics";
import { authApi, authQueryKey } from "@/services/api/auth";
import { audioAssetsApi } from "@/services/api/audioAssets";
import { calendarApi } from "@/services/api/calendar";
import { contentItemsApi } from "@/services/api/contentItems";
import { creditsApi } from "@/services/api/credits";
import { dashboardApi } from "@/services/api/dashboard";
import {
  driveWorkspaceApi,
  driveWorkspaceQueryKey,
  isDriveWorkspaceDisconnectedError,
} from "@/services/api/driveWorkspace";
import {
  googleDriveApi,
  googleDriveConnectionQueryKey,
  openGoogleAuthorizationUrl,
  type GoogleDriveConnectionStatus,
} from "@/services/api/googleDrive";
import { ApiError } from "@/services/api/client";
import { releaseChecklistApi } from "@/services/api/releaseChecklist";
import { releasesApi } from "@/services/api/releases";
import { songsApi, isUsingFallbackData } from "@/services/api/songs";
import { visualAssetsApi } from "@/services/api/visualAssets";
import {
  ANALYTICS_PLATFORM_LABELS,
  ANALYTICS_PLATFORMS,
  AUDIO_ASSET_STATUSES,
  AUDIO_ASSET_TYPES,
  CALENDAR_EVENT_TYPE_LABELS,
  CONTENT_PLATFORMS,
  CONTENT_PLATFORM_LABELS,
  CONTENT_STATUSES,
  CONTENT_STATUS_LABELS,
  CONTENT_TYPES,
  CONTENT_TYPE_LABELS,
  CREDIT_ROLES,
  CREDIT_ROLE_LABELS,
  CREDIT_STATUSES,
  RELEASE_PLATFORM_LABELS,
  RELEASE_PLATFORMS,
  RELEASE_STATUSES,
  RELEASE_STATUS_LABELS,
  RELEASE_TYPES,
  RELEASE_TYPE_LABELS,
  SONG_STATUS_LABELS,
  SONG_STATUSES,
  VISUAL_ASSET_STATUSES,
  VISUAL_ASSET_STATUS_LABELS,
  VISUAL_ASSET_TYPES,
  VISUAL_ASSET_TYPE_LABELS,
  type AnalyticsPlatform,
  type AnalyticsSnapshot,
  type AnalyticsSnapshotPayload,
  type AudioAsset,
  type AudioAssetPayload,
  type AudioAssetStatus,
  type AudioAssetType,
  type CalendarEntry,
  type CalendarEventType,
  type ContentItem,
  type ContentItemPayload,
  type ContentPlatform,
  type ContentStatus,
  type ContentType,
  type Credit,
  type CreditPayload,
  type CreditRole,
  type CreditStatus,
  type DriveWorkspace,
  type ExternalFileReference,
  type DashboardActivityItem,
  type DashboardAnalyticsItem,
  type DashboardPipelineItem,
  type DashboardReleaseReadiness,
  type DashboardUpcomingItem,
  type Release,
  type ReleaseChecklistItem,
  type ReleaseChecklistItemPayload,
  type ReleasePayload,
  type ReleasePlatform,
  type ReleaseStatus,
  type ReleaseType,
  type Song,
  type SongPayload,
  type SongStatus,
  type VisualAsset,
  type VisualAssetPayload,
  type VisualAssetStatus,
  type VisualAssetType,
} from "@/types";
import { cn } from "@/lib/utils";

import {
  creditsQueryKey,
  normalizeId,
  numberOrNull,
  READ_ONLY_SONG_ACCESS,
  releaseReadinessQueryKey,
  type SongAccess,
} from "../shared";

function useCreditMutations(songId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: creditsQueryKey(songId) });
    queryClient.invalidateQueries({ queryKey: releaseReadinessQueryKey(songId) });
  };

  return {
    create: useMutation({
      mutationFn: (payload: CreditPayload) => creditsApi.createCredit(songId, payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ creditId, payload }: { creditId: string; payload: CreditPayload }) =>
        creditsApi.updateCredit(songId, creditId, payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (creditId: string) => creditsApi.deleteCredit(songId, creditId),
      onSuccess: invalidate,
    }),
  };
}

function isCreditRole(value: string): value is CreditRole {
  return CREDIT_ROLES.includes(value as CreditRole);
}

function isCreditStatus(value: string): value is CreditStatus {
  return CREDIT_STATUSES.includes(value as CreditStatus);
}

function creditRoleLabel(role: CreditRole) {
  return CREDIT_ROLE_LABELS[role];
}

function optionalCreditText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed || null;
}

function plannedSplitLabel(value?: number | null) {
  if (value == null) return "Not set";
  return `${formatNumber(value)}% planned`;
}

function creditNotesPreview(notes?: string | null) {
  const trimmed = notes?.trim();
  if (!trimmed) return null;
  return trimmed.length > 180 ? `${trimmed.slice(0, 177)}...` : trimmed;
}

function creditSummaryDetails(credits: Credit[]) {
  const contributorNames = new Set(
    credits.map((credit) => credit.contributorName.trim().toLocaleLowerCase()).filter(Boolean),
  );
  const recordedSplits = credits
    .map((credit) => credit.splitPercentage)
    .filter((value): value is number => value != null);
  const plannedSplitTotal = recordedSplits.reduce((total, value) => total + value, 0);

  return {
    totalCredits: credits.length,
    contributors: contributorNames.size,
    confirmed: credits.filter((credit) => credit.status === "Confirmed").length,
    pending: credits.filter((credit) => credit.status === "Pending").length,
    recordedSplits: recordedSplits.length,
    plannedSplitTotal,
  };
}

function creditAttentionItems(credit: Credit) {
  const items: string[] = [];
  if (credit.status === "Pending") items.push("Pending confirmation");
  if (credit.splitPercentage == null) items.push("Split not recorded");
  if (!optionalCreditText(credit.contact)) items.push("Contact not recorded");
  return items;
}

function sortCreditsForSheet(credits: Credit[]) {
  return [...credits].sort((a, b) => {
    const nameComparison = a.contributorName.localeCompare(b.contributorName);
    if (nameComparison !== 0) return nameComparison;

    const roleComparison = creditRoleLabel(a.role).localeCompare(creditRoleLabel(b.role));
    if (roleComparison !== 0) return roleComparison;

    return String(a.id).localeCompare(String(b.id));
  });
}

function validateCreditPayload(payload: CreditPayload) {
  const contributorName = payload.contributorName.trim();
  if (!contributorName) return "Contributor name is required.";
  if (contributorName.length > 160) return "Contributor name must be 160 characters or fewer.";
  if (!isCreditRole(payload.role)) return "Choose a valid role.";
  if (!isCreditStatus(payload.status)) return "Choose a valid status.";
  if (payload.contact && payload.contact.trim().length > 160) {
    return "Contact must be 160 characters or fewer.";
  }
  if (
    payload.splitPercentage != null &&
    (payload.splitPercentage < 0 || payload.splitPercentage > 100)
  ) {
    return "Planned split must be between 0 and 100.";
  }
  if (payload.notes && payload.notes.trim().length > 1000) {
    return "Notes must be 1000 characters or fewer.";
  }
  return "";
}

function CreditFormDialog({
  songId,
  credit,
  trigger,
}: {
  songId: string;
  credit?: Credit;
  trigger: ReactNode;
}) {
  const mode = credit ? "edit" : "create";
  const mutations = useCreditMutations(songId);
  const mutation = mode === "create" ? mutations.create : mutations.update;
  const [open, setOpen] = useState(false);
  const [contributorName, setContributorName] = useState(credit?.contributorName ?? "");
  const [role, setRole] = useState<CreditRole>(credit?.role ?? "Artist");
  const [contact, setContact] = useState(credit?.contact ?? "");
  const [status, setStatus] = useState<CreditStatus>(credit?.status ?? "Pending");
  const [splitPercentage, setSplitPercentage] = useState(
    credit?.splitPercentage == null ? "" : String(credit.splitPercentage),
  );
  const [notes, setNotes] = useState(credit?.notes ?? "");
  const [error, setError] = useState("");

  async function submit() {
    const plannedSplit = numberOrNull(splitPercentage);
    const payload: CreditPayload = {
      contributorName: contributorName.trim(),
      role,
      contact: contact.trim() || null,
      status,
      splitPercentage: plannedSplit,
      notes: notes.trim() || null,
    };
    const validationError = validateCreditPayload(payload);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      if (mode === "create") {
        await mutations.create.mutateAsync(payload);
        setContributorName("");
        setRole("Artist");
        setContact("");
        setStatus("Pending");
        setSplitPercentage("");
        setNotes("");
      } else if (credit) {
        await mutations.update.mutateAsync({
          creditId: String(credit.id),
          payload,
        });
      }
      setError("");
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The credit could not be saved.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="border-border bg-background">
        <DialogHeader>
          <DialogTitle className="uppercase">
            {mode === "create" ? "Add credit" : "Edit credit"}
          </DialogTitle>
          <DialogDescription>
            Record contributor credit details for this Song. Planned split is optional metadata for
            this credit.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-tech" htmlFor={`${mode}-credit-name-${credit?.id ?? "new"}`}>
              Contributor name
            </label>
            <Input
              id={`${mode}-credit-name-${credit?.id ?? "new"}`}
              value={contributorName}
              maxLength={160}
              onChange={(event) => setContributorName(event.target.value)}
              className="mt-2"
              placeholder="Kira Mott"
            />
          </div>
          <div>
            <label className="label-tech">Role</label>
            <Select value={role} onValueChange={(value) => setRole(value as CreditRole)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CREDIT_ROLES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {creditRoleLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="label-tech" htmlFor={`${mode}-credit-contact-${credit?.id ?? "new"}`}>
              Contact
            </label>
            <Input
              id={`${mode}-credit-contact-${credit?.id ?? "new"}`}
              value={contact}
              maxLength={160}
              onChange={(event) => setContact(event.target.value)}
              className="mt-2"
              placeholder="kira@darkroom.system"
            />
          </div>
          <div>
            <label className="label-tech">Status</label>
            <Select value={status} onValueChange={(value) => setStatus(value as CreditStatus)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CREDIT_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="label-tech" htmlFor={`${mode}-credit-split-${credit?.id ?? "new"}`}>
              Planned split %
            </label>
            <Input
              id={`${mode}-credit-split-${credit?.id ?? "new"}`}
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={splitPercentage}
              onChange={(event) => setSplitPercentage(event.target.value)}
              className="mt-2"
              placeholder="25"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Optional planning percentage for this credit.
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className="label-tech" htmlFor={`${mode}-credit-notes-${credit?.id ?? "new"}`}>
              Notes
            </label>
            <Textarea
              id={`${mode}-credit-notes-${credit?.id ?? "new"}`}
              value={notes}
              maxLength={1000}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-2"
              placeholder="Contributor notes or pending confirmation details."
            />
          </div>
          {error ? <p className="text-sm text-muted-foreground sm:col-span-2">{error}</p> : null}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={mutation.isPending}>
              {mutation.isPending ? "Saving" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreditRow({
  songId,
  credit,
  access,
}: {
  songId: string;
  credit: Credit;
  access: SongAccess;
}) {
  const mutations = useCreditMutations(songId);
  const contact = optionalCreditText(credit.contact);
  const notesPreview = creditNotesPreview(credit.notes);
  const attentionItems = creditAttentionItems(credit);

  return (
    <article className="border border-border bg-background p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold">{credit.contributorName}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="border border-border px-2 py-1">{creditRoleLabel(credit.role)}</span>
          </div>
        </div>
        <StatusBadge status={credit.status} />
      </div>
      <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
        <div className="border border-border bg-panel p-3">
          <dt className="label-tech">Planned split</dt>
          <dd className="mt-1 text-foreground">{plannedSplitLabel(credit.splitPercentage)}</dd>
        </div>
        <div className="border border-border bg-panel p-3">
          <dt className="label-tech">Contact</dt>
          <dd className="mt-1 break-all text-foreground">{contact ?? "Not recorded"}</dd>
        </div>
        <div className="border border-border bg-panel p-3">
          <dt className="label-tech">Updated</dt>
          <dd className="mt-1 text-foreground">{formatDate(credit.updatedAt)}</dd>
        </div>
      </dl>
      {notesPreview ? (
        <p className="mt-3 break-words border-l border-border pl-3 text-xs text-muted-foreground">
          {notesPreview}
        </p>
      ) : null}
      {attentionItems.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {attentionItems.map((item) => (
            <span
              key={item}
              className="border border-border px-2 py-1 text-xs text-muted-foreground"
            >
              {item}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Created {formatDate(credit.createdAt)}</p>
        {access.canEdit ? (
          <div className="flex gap-2">
            <CreditFormDialog
              songId={songId}
              credit={credit}
              trigger={
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              }
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove credit?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes only this contributor credit metadata from this Song. DARKROOM
                    SYSTEM users, team access, and external distributor records are not affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => mutations.remove.mutate(String(credit.id))}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function CreditsLoadingState() {
  return (
    <div className="space-y-4" aria-label="Loading credits contributors">
      <Panel title="CREDITS" label="CREDITS / CONTRIBUTORS">
        <div className="space-y-3">
          <div className="h-4 w-2/3 animate-pulse bg-panel-strong" />
          <div className="h-4 w-1/3 animate-pulse bg-panel-strong" />
        </div>
      </Panel>
      <Panel title="Summary" label="SUMMARY">
        <div className="grid gap-2 sm:grid-cols-4">
          {["credits", "contributors", "confirmed", "pending"].map((item) => (
            <div key={item} className="border border-border bg-background p-4">
              <div className="h-7 w-10 animate-pulse bg-panel-strong" />
              <div className="mt-4 h-3 w-24 animate-pulse bg-panel-strong" />
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Contributors" label="CONTRIBUTORS">
        <div className="grid gap-3">
          {[0, 1].map((item) => (
            <div key={item} className="border border-border bg-background p-4">
              <div className="h-4 w-3/4 animate-pulse bg-panel-strong" />
              <div className="mt-3 h-3 w-1/2 animate-pulse bg-panel-strong" />
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {[0, 1, 2].map((field) => (
                  <div key={field} className="h-12 animate-pulse border border-border bg-panel" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export function CreditsWorkspace({
  songId,
  access = READ_ONLY_SONG_ACCESS,
}: {
  songId: string;
  access?: SongAccess;
}) {
  const credits = useQuery({
    queryKey: creditsQueryKey(songId),
    queryFn: () => creditsApi.getCredits(songId),
  });

  if (credits.isLoading) {
    return <CreditsLoadingState />;
  }

  if (credits.isError) {
    return (
      <Panel title="Credits unavailable" label="CREDITS / CONTRIBUTORS">
        <ErrorState
          detail="We couldn't load contributor credits from DARKROOM SYSTEM."
          onRetry={() => credits.refetch()}
        />
      </Panel>
    );
  }

  const items = credits.data ?? [];
  const summary = creditSummaryDetails(items);
  const sortedItems = sortCreditsForSheet(items);

  return (
    <div className="space-y-4">
      <Panel title="CREDITS" label="CREDITS / CONTRIBUTORS">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Track who contributed, what they did, and which credits still need confirmation.
          </p>
          {access.canEdit ? (
            <CreditFormDialog
              songId={songId}
              trigger={
                <Button>
                  <Plus className="h-4 w-4" />
                  Add Credit
                </Button>
              }
            />
          ) : null}
        </div>
      </Panel>

      <Panel title="Summary" label="SUMMARY">
        <div className="grid gap-2 sm:grid-cols-4">
          <MetricBlock label="TOTAL CREDITS" value={String(summary.totalCredits)} />
          <MetricBlock label="CONTRIBUTORS" value={String(summary.contributors)} />
          <MetricBlock label="CONFIRMED" value={String(summary.confirmed)} />
          <MetricBlock label="PENDING" value={String(summary.pending)} />
        </div>
      </Panel>

      {items.length ? (
        <Panel title="Planned splits" label="CREDIT COVERAGE / PLANNED SPLITS">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div>
              <p className="font-mono text-3xl leading-none">
                {formatNumber(summary.plannedSplitTotal)}% recorded
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Sum of currently recorded planned split metadata across {summary.recordedSplits}{" "}
                {summary.recordedSplits === 1 ? "credit" : "credits"}.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Missing splits are allowed. Totals are informational only.
            </p>
          </div>
        </Panel>
      ) : null}

      <Panel title="Contributors" label="CONTRIBUTORS">
        {access.canEdit ? (
          <CreditFormDialog
            songId={songId}
            trigger={
              <Button variant="outline" size="sm" className="mb-4">
                <Plus className="h-4 w-4" />
                Add Credit
              </Button>
            }
          />
        ) : null}
        {sortedItems.length ? (
          <div className="grid gap-3">
            {sortedItems.map((credit) => (
              <CreditRow key={credit.id} songId={songId} credit={credit} access={access} />
            ))}
          </div>
        ) : (
          <EmptyState title="NO CREDITS ADDED" detail="Build the contributor list for this Song." />
        )}
      </Panel>
    </div>
  );
}
