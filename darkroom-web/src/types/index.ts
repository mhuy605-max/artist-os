/** Canonical domain types for DARKROOM SYSTEM. */

/** Backend-allowed Song statuses (exact values submitted to the API). */
export const SONG_STATUSES = [
  "Idea",
  "Demo",
  "Recording",
  "Mixing",
  "Mastering",
  "ReleasePreparation",
  "ContentCampaign",
  "Released",
  "Analytics",
] as const;

export type SongStatus = (typeof SONG_STATUSES)[number];

export const SONG_STATUS_LABELS: Record<SongStatus, string> = {
  Idea: "Idea",
  Demo: "Demo",
  Recording: "Recording",
  Mixing: "Mixing",
  Mastering: "Mastering",
  ReleasePreparation: "Release Preparation",
  ContentCampaign: "Content Campaign",
  Released: "Released",
  Analytics: "Analytics",
};

/** Lifecycle order used for progress indicators. */
export const SONG_LIFECYCLE: SongStatus[] = [
  "Idea",
  "Demo",
  "Recording",
  "Mixing",
  "Mastering",
  "ReleasePreparation",
  "ContentCampaign",
  "Released",
];

/** Song as returned by the real ASP.NET Core API. */
export const SONG_ROLES = ["OWNER", "EDITOR", "VIEWER"] as const;

export type SongRole = (typeof SONG_ROLES)[number];

export const COLLABORATOR_ROLES = ["EDITOR", "VIEWER"] as const;

export type CollaboratorRole = (typeof COLLABORATOR_ROLES)[number];

export interface Song {
  id: string | number;
  title: string;
  status: string;
  createdAt: string;
  ownerUserId?: string | number | null;
  currentUserRole?: SongRole | string | null;
  canEdit?: boolean | null;
  canManageMembers?: boolean | null;
}

export interface SongPayload {
  title: string;
  status: SongStatus;
}

export interface AuthUser {
  id: string | number;
  email: string;
  displayName?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresAt: string;
  user: AuthUser;
}

export interface UserSummary {
  id: string | number;
  email: string;
  displayName?: string | null;
}

export interface SongMember {
  memberId?: string | number | null;
  userId: string | number;
  email: string;
  displayName?: string | null;
  role: SongRole | string;
  joinedAt?: string | null;
}

export interface SongInvitation {
  id: string | number;
  songId: string | number;
  invitedUser: UserSummary;
  invitedByUser: UserSummary;
  role: CollaboratorRole | string;
  status: string;
  createdAt: string;
  respondedAt?: string | null;
}

export interface InvitationInboxItem {
  invitationId: string | number;
  songId: string | number;
  songTitle: string;
  invitedByUser: UserSummary;
  role: CollaboratorRole | string;
  status: string;
  createdAt: string;
}

export interface InviteSongMemberPayload {
  email: string;
  role: CollaboratorRole;
}

export interface UpdateSongMemberRolePayload {
  role: CollaboratorRole;
}

export interface DriveWorkspaceFolder {
  name: string;
  externalId: string;
  resourceType: string;
}

export interface DriveWorkspaceFolders {
  audio?: DriveWorkspaceFolder | null;
  visuals?: DriveWorkspaceFolder | null;
  release?: DriveWorkspaceFolder | null;
  content?: DriveWorkspaceFolder | null;
}

export interface DriveWorkspace {
  isProvisioned: boolean;
  googleDriveStatus?: string | null;
  rootFolder?: DriveWorkspaceFolder | null;
  songsFolder?: DriveWorkspaceFolder | null;
  songFolder?: DriveWorkspaceFolder | null;
  folders: DriveWorkspaceFolders;
}

export interface ExternalFileReference {
  id: string | number;
  provider: string;
  resourceType: string;
  isFolder: boolean;
  displayName: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  webViewLink?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  displayName?: string | null;
}

/* ---------- Mocked (backend not implemented yet) ---------- */

export interface SongMeta {
  songId: string;
  artist: string;
  bpm: number;
  songKey: string;
  genre: string;
  notes: string;
  releaseDate?: string;
  lastUpdated: string;
  progress: number;
  collaborators: string[];
}

export const AUDIO_ASSET_TYPES = ["Demo", "Recording", "Mix", "Master"] as const;

export type AudioAssetType = (typeof AUDIO_ASSET_TYPES)[number];

export const AUDIO_ASSET_STATUSES = ["Draft", "Review", "Approved", "Final"] as const;

export type AudioAssetStatus = (typeof AUDIO_ASSET_STATUSES)[number];

/** Audio asset metadata as returned by the real ASP.NET Core API. */
export interface AudioAsset {
  id: string | number;
  songId: string | number;
  assetFamilyId: string;
  type: AudioAssetType;
  fileName: string;
  version: number;
  status: AudioAssetStatus;
  durationSeconds?: number | null;
  fileSizeBytes?: number | null;
  uploadedAt: string;
  isCurrent: boolean;
  linkedFile?: ExternalFileReference | null;
}

export interface MediaAccessResponse {
  mediaUrl: string;
  expiresAt: string;
  mimeType: string;
  fileName: string;
  sizeBytes?: number | null;
}

export interface AudioAssetPayload {
  type: AudioAssetType;
  fileName: string;
  version: number;
  status: AudioAssetStatus;
  durationSeconds?: number | null;
  fileSizeBytes?: number | null;
  isCurrent: boolean;
}

export const VISUAL_ASSET_TYPES = [
  "CoverArt",
  "MusicVideo",
  "Visualizer",
  "SpotifyCanvas",
  "PromoAsset",
  "SocialContent",
] as const;

export type VisualAssetType = (typeof VISUAL_ASSET_TYPES)[number];

export const VISUAL_ASSET_TYPE_LABELS: Record<VisualAssetType, string> = {
  CoverArt: "Cover Art",
  MusicVideo: "Music Video",
  Visualizer: "Visualizer",
  SpotifyCanvas: "Spotify Canvas",
  PromoAsset: "Promo Asset",
  SocialContent: "Social Content",
};

export const VISUAL_ASSET_STATUSES = [
  "Draft",
  "InProgress",
  "Review",
  "Approved",
  "Final",
] as const;

export type VisualAssetStatus = (typeof VISUAL_ASSET_STATUSES)[number];

export const VISUAL_ASSET_STATUS_LABELS: Record<VisualAssetStatus, string> = {
  Draft: "Draft",
  InProgress: "In Progress",
  Review: "Review",
  Approved: "Approved",
  Final: "Final",
};

/** Visual asset metadata as returned by the real ASP.NET Core API. */
export interface VisualAsset {
  id: string | number;
  songId: string | number;
  assetFamilyId: string;
  type: VisualAssetType;
  fileName: string;
  version: number;
  status: VisualAssetStatus;
  width?: number | null;
  height?: number | null;
  fileSizeBytes?: number | null;
  uploadedAt: string;
  isCurrent: boolean;
  linkedFile?: ExternalFileReference | null;
}

export interface VisualAssetPayload {
  type: VisualAssetType;
  fileName: string;
  version: number;
  status: VisualAssetStatus;
  width?: number | null;
  height?: number | null;
  fileSizeBytes?: number | null;
  isCurrent: boolean;
}

export const RELEASE_TYPES = ["Single"] as const;

export type ReleaseType = (typeof RELEASE_TYPES)[number];

export const RELEASE_TYPE_LABELS: Record<ReleaseType, string> = {
  Single: "Single",
};

export const RELEASE_STATUSES = [
  "Planning",
  "Preparing",
  "Ready",
  "Scheduled",
  "Released",
] as const;

export type ReleaseStatus = (typeof RELEASE_STATUSES)[number];

export const RELEASE_STATUS_LABELS: Record<ReleaseStatus, string> = {
  Planning: "Planning",
  Preparing: "Preparing",
  Ready: "Ready",
  Scheduled: "Scheduled",
  Released: "Released",
};

export const RELEASE_PLATFORMS = [
  "Spotify",
  "AppleMusic",
  "YouTube",
  "YouTubeMusic",
  "SoundCloud",
  "TikTok",
  "Other",
] as const;

export type ReleasePlatform = (typeof RELEASE_PLATFORMS)[number];

export const RELEASE_PLATFORM_LABELS: Record<ReleasePlatform, string> = {
  Spotify: "Spotify",
  AppleMusic: "Apple Music",
  YouTube: "YouTube",
  YouTubeMusic: "YouTube Music",
  SoundCloud: "SoundCloud",
  TikTok: "TikTok",
  Other: "Other",
};

/** Release planning metadata as returned by the real ASP.NET Core API. */
export interface Release {
  id: string | number;
  songId: string | number;
  releaseDate?: string | null;
  releaseType: ReleaseType;
  distributor?: string | null;
  isrc?: string | null;
  upc?: string | null;
  status: ReleaseStatus;
  platforms: ReleasePlatform[];
  createdAt: string;
  updatedAt: string;
}

export interface ReleasePayload {
  releaseDate?: string | null;
  releaseType: ReleaseType;
  distributor?: string | null;
  isrc?: string | null;
  upc?: string | null;
  status: ReleaseStatus;
  platforms: ReleasePlatform[];
}

export const RELEASE_CHECKLIST_KEYS = [
  "Master",
  "Cover",
  "Metadata",
  "Credits",
  "Canvas",
  "MusicVideo",
  "ContentPlan",
] as const;

export type ReleaseChecklistKey = (typeof RELEASE_CHECKLIST_KEYS)[number];

export const RELEASE_CHECKLIST_LABELS: Record<ReleaseChecklistKey, string> = {
  Master: "Master",
  Cover: "Cover",
  Metadata: "Metadata",
  Credits: "Credits",
  Canvas: "Canvas",
  MusicVideo: "Music Video",
  ContentPlan: "Content Plan",
};

export interface ReleaseChecklistItem {
  id: string | number;
  releaseId: string | number;
  key: ReleaseChecklistKey;
  label: string;
  isCompleted: boolean;
  completedAt?: string | null;
  notes?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReleaseChecklistItemPayload {
  isCompleted: boolean;
  notes?: string | null;
}

export const RELEASE_READINESS_STATES = ["Ready", "Incomplete", "NotRequired"] as const;

export type ReleaseReadinessState = (typeof RELEASE_READINESS_STATES)[number];

export const RELEASE_READINESS_SOURCES = ["Derived", "Hybrid", "Manual"] as const;

export type ReleaseReadinessSource = (typeof RELEASE_READINESS_SOURCES)[number];

export interface ReleaseReadinessItem {
  key: ReleaseChecklistKey;
  label: string;
  state: ReleaseReadinessState;
  source: ReleaseReadinessSource;
  reason: string;
  isRequired: boolean;
  relatedResourceId?: string | number | null;
  relatedResourceType?: string | null;
}

export interface ReleaseReadiness {
  songId: string | number;
  releaseId: string | number;
  readyCount: number;
  requiredCount: number;
  totalCount: number;
  percentage: number;
  items: ReleaseReadinessItem[];
}

export const CONTENT_TYPES = [
  "Teaser",
  "Snippet",
  "MusicVideo",
  "Visualizer",
  "BehindTheScenes",
  "TikTok",
  "InstagramReel",
  "YouTubeShort",
  "ArtworkPost",
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  Teaser: "Teaser",
  Snippet: "Snippet",
  MusicVideo: "Music Video",
  Visualizer: "Visualizer",
  BehindTheScenes: "Behind The Scenes",
  TikTok: "TikTok",
  InstagramReel: "Instagram Reel",
  YouTubeShort: "YouTube Short",
  ArtworkPost: "Artwork Post",
};

export const CONTENT_STATUSES = [
  "Idea",
  "Planned",
  "InProduction",
  "Editing",
  "Ready",
  "Scheduled",
  "Published",
] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  Idea: "Idea",
  Planned: "Planned",
  InProduction: "In Production",
  Editing: "Editing",
  Ready: "Ready",
  Scheduled: "Scheduled",
  Published: "Published",
};

export const CONTENT_PLATFORMS = [
  "Instagram",
  "TikTok",
  "YouTube",
  "YouTubeShorts",
  "Spotify",
  "CrossPlatform",
  "Other",
] as const;

export type ContentPlatform = (typeof CONTENT_PLATFORMS)[number];

export const CONTENT_PLATFORM_LABELS: Record<ContentPlatform, string> = {
  Instagram: "Instagram",
  TikTok: "TikTok",
  YouTube: "YouTube",
  YouTubeShorts: "YouTube Shorts",
  Spotify: "Spotify",
  CrossPlatform: "Cross Platform",
  Other: "Other",
};

export interface ContentItem {
  id: string | number;
  songId: string | number;
  title: string;
  type: ContentType;
  status: ContentStatus;
  platform?: ContentPlatform | null;
  ownerName?: string | null;
  dueDate?: string | null;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentItemPayload {
  title: string;
  type: ContentType;
  status: ContentStatus;
  platform?: ContentPlatform | null;
  ownerName?: string | null;
  dueDate?: string | null;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  notes?: string | null;
}

export const CREDIT_ROLES = [
  "Artist",
  "FeaturedArtist",
  "Producer",
  "Songwriter",
  "RecordingEngineer",
  "MixEngineer",
  "MasteringEngineer",
  "Director",
  "Designer",
] as const;

export type CreditRole = (typeof CREDIT_ROLES)[number];

export const CREDIT_ROLE_LABELS: Record<CreditRole, string> = {
  Artist: "Artist",
  FeaturedArtist: "Featured Artist",
  Producer: "Producer",
  Songwriter: "Songwriter",
  RecordingEngineer: "Recording Engineer",
  MixEngineer: "Mix Engineer",
  MasteringEngineer: "Mastering Engineer",
  Director: "Director",
  Designer: "Designer",
};

export const CREDIT_STATUSES = ["Pending", "Confirmed"] as const;

export type CreditStatus = (typeof CREDIT_STATUSES)[number];

export interface Credit {
  id: string | number;
  songId: string | number;
  contributorName: string;
  role: CreditRole;
  contact?: string | null;
  status: CreditStatus;
  splitPercentage?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreditPayload {
  contributorName: string;
  role: CreditRole;
  contact?: string | null;
  status: CreditStatus;
  splitPercentage?: number | null;
  notes?: string | null;
}

export const ANALYTICS_PLATFORMS = ["YouTube", "Spotify", "TikTok", "Instagram", "Other"] as const;

export type AnalyticsPlatform = (typeof ANALYTICS_PLATFORMS)[number];

export const ANALYTICS_PLATFORM_LABELS: Record<AnalyticsPlatform, string> = {
  YouTube: "YouTube",
  Spotify: "Spotify",
  TikTok: "TikTok",
  Instagram: "Instagram",
  Other: "Other",
};

export interface AnalyticsSnapshot {
  id: string | number;
  songId: string | number;
  platform: AnalyticsPlatform;
  snapshotDate: string;
  views: number;
  likes: number;
  comments: number;
  watchTimeMinutes: number;
  subscribersGained: number;
  createdAt: string;
}

export interface AnalyticsSnapshotPayload {
  platform: AnalyticsPlatform;
  snapshotDate: string;
  views: number;
  likes: number;
  comments: number;
  watchTimeMinutes: number;
  subscribersGained: number;
}

export interface ActivityEvent {
  id: string;
  songId?: string;
  songTitle?: string;
  actor: string;
  action: string;
  at: string;
}

export const CALENDAR_EVENT_TYPES = [
  "ReleaseDate",
  "ContentDue",
  "ContentScheduled",
  "ContentPublished",
] as const;

export type CalendarEventType = (typeof CALENDAR_EVENT_TYPES)[number];

export const CALENDAR_EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  ReleaseDate: "Release",
  ContentDue: "Content Due",
  ContentScheduled: "Scheduled Content",
  ContentPublished: "Published Content",
};

export interface CalendarEntry {
  sourceType: "Release" | "ContentItem";
  sourceId: string | number;
  songId: string | number;
  songTitle: string;
  eventType: CalendarEventType;
  title: string;
  date: string;
  status: string;
  platform?: string | null;
  isEditable: boolean;
  navigationTarget: string;
}

export interface DashboardSummary {
  totalSongs: number;
  activeSongs: number;
  upcomingReleases: number;
  scheduledContent: number;
}

export interface DashboardPipelineItem {
  status: SongStatus;
  label: string;
  count: number;
}

export interface DashboardUpcomingItem {
  sourceType: "Release" | "ContentItem";
  sourceId: string | number;
  songId: string | number;
  songTitle: string;
  eventType: "ReleaseDate" | "ContentDue" | "ContentScheduled";
  title: string;
  date: string;
  status: string;
  platform?: string | null;
  navigationTarget: string;
}

export interface DashboardReleaseReadiness {
  releaseId: string | number;
  songId: string | number;
  songTitle: string;
  releaseDate?: string | null;
  status: string;
  completedItems: number;
  totalItems: number;
  readinessPercentage: number;
  navigationTarget: string;
}

export interface DashboardAnalyticsItem {
  songId: string | number;
  songTitle: string;
  platform: AnalyticsPlatform;
  snapshotDate: string;
  views: number;
  likes: number;
  comments: number;
  watchTimeMinutes: number;
  subscribersGained: number;
  navigationTarget: string;
}

export interface DashboardActivityItem {
  type: string;
  songId: string | number;
  songTitle: string;
  description: string;
  occurredAt: string;
  navigationTarget: string;
}

export interface DashboardResponse {
  summary: DashboardSummary;
  pipeline: DashboardPipelineItem[];
  upcoming: DashboardUpcomingItem[];
  releaseReadiness: DashboardReleaseReadiness[];
  analyticsOverview: DashboardAnalyticsItem[];
  recentActivity: DashboardActivityItem[];
}
