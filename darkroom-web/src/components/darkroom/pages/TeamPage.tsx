import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/services/api/client";
import {
  collaborationApi,
  invitationInboxQueryKey,
  songMembersQueryKey,
} from "@/services/api/collaboration";
import type { InvitationInboxItem, SongInvitation } from "@/services/api/types/collaboration";

import { AppShell } from "../AppShell";
import { EmptyState, ErrorState, LoadingState, PageHeader, Panel, formatDate } from "../Primitives";
import { parseApiProblemTitle } from "../workbench/shared";
import { dashboardQueryKey, songsQueryKey } from "./page-query-keys";

export function TeamPage() {
  return (
    <AppShell>
      <InvitationInbox />
    </AppShell>
  );
}

function InvitationInbox() {
  const invitations = useQuery({
    queryKey: invitationInboxQueryKey,
    queryFn: collaborationApi.getInvitations,
    retry: false,
  });

  return (
    <>
      <PageHeader eyebrow="Team" title="Song invitations" />
      <Panel title="Invitation inbox" label="Collaboration">
        {invitations.isLoading ? (
          <LoadingState label="Loading invitations" />
        ) : invitations.isError ? (
          <ErrorState
            title="Invitations unavailable"
            detail="Your pending song invitations could not be loaded."
            onRetry={() => invitations.refetch()}
          />
        ) : invitations.data?.length ? (
          <div className="divide-y divide-border border border-border bg-panel">
            {invitations.data.map((invitation) => (
              <InvitationInboxRow key={String(invitation.invitationId)} invitation={invitation} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No pending invitations"
            detail="Song workspace invitations for your account will appear here."
          />
        )}
      </Panel>
    </>
  );
}

function InvitationInboxRow({ invitation }: { invitation: InvitationInboxItem }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const invitationId = String(invitation.invitationId);
  const invalidateInvitationState = (response?: SongInvitation) => {
    queryClient.invalidateQueries({ queryKey: invitationInboxQueryKey });
    queryClient.invalidateQueries({ queryKey: songsQueryKey });
    queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
    queryClient.invalidateQueries({ queryKey: ["calendar"] });
    const songId = String(response?.songId ?? invitation.songId);
    queryClient.invalidateQueries({ queryKey: ["songs", songId] });
    queryClient.invalidateQueries({ queryKey: songMembersQueryKey(songId) });
  };
  const accept = useMutation({
    mutationFn: () => collaborationApi.acceptInvitation(invitationId),
    onSuccess: (response) => {
      setMessage("Invitation accepted.");
      invalidateInvitationState(response);
    },
    onError: (error) => {
      setMessage(invitationActionError(error, "Invitation could not be accepted."));
      invalidateInvitationState();
    },
  });
  const decline = useMutation({
    mutationFn: () => collaborationApi.declineInvitation(invitationId),
    onSuccess: (response) => {
      setMessage("Invitation declined.");
      invalidateInvitationState(response);
    },
    onError: (error) => {
      setMessage(invitationActionError(error, "Invitation could not be declined."));
      invalidateInvitationState();
    },
  });
  const busy = accept.isPending || decline.isPending;
  const inviter = invitation.invitedByUser.displayName?.trim() || invitation.invitedByUser.email;

  return (
    <article className="grid gap-4 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="min-w-0">
        <p className="label-tech">Song workspace</p>
        <Link
          to="/songs/$songId"
          params={{ songId: String(invitation.songId) }}
          className="mt-2 block truncate text-lg font-semibold uppercase hover:text-muted-foreground"
          title={invitation.songTitle}
        >
          {invitation.songTitle}
        </Link>
        <p className="mt-2 text-sm text-muted-foreground">
          Invited by {inviter} as {invitationRoleLabel(invitation.role)}.
        </p>
        <p className="mt-1 text-xs uppercase text-muted-foreground">
          Received {formatDate(invitation.createdAt)}
        </p>
        {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
        <Button
          className="gap-2"
          disabled={busy}
          onClick={() => {
            if (!busy) accept.mutate();
          }}
        >
          <Check className="h-4 w-4" />
          {accept.isPending ? "Accepting" : "Accept"}
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          disabled={busy}
          onClick={() => {
            if (!busy) decline.mutate();
          }}
        >
          <X className="h-4 w-4" />
          {decline.isPending ? "Declining" : "Decline"}
        </Button>
      </div>
    </article>
  );
}

function invitationRoleLabel(role: string) {
  if (role === "EDITOR") return "Editor";
  if (role === "VIEWER") return "Viewer";
  return role;
}

function invitationActionError(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.status === 404) return "Invitation is no longer available.";
    if (error.status === 403) return "You no longer have permission to manage this action.";
    if (error.status === 409)
      return parseApiProblemTitle(error) || "Invitation is no longer pending.";
    return parseApiProblemTitle(error) || error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}
