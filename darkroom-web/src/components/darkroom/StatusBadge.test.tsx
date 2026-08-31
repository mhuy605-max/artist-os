import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusBadge } from "./StatusBadge";
import { SONG_LIFECYCLE, SONG_STATUS_LABELS, SONG_STATUSES } from "@/types";

describe("StatusBadge", () => {
  it("renders canonical Song status labels", () => {
    render(<StatusBadge status="ReleasePreparation" />);

    expect(screen.getByText("Release Preparation")).toBeInTheDocument();
  });

  it("falls back to the raw label for non-Song statuses", () => {
    render(<StatusBadge status="Approved" />);

    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  it("keeps the expected Song status order stable", () => {
    expect(SONG_STATUSES).toEqual([
      "Idea",
      "Demo",
      "Recording",
      "Mixing",
      "Mastering",
      "ReleasePreparation",
      "ContentCampaign",
      "Released",
      "Analytics",
    ]);
    expect(SONG_LIFECYCLE).toEqual([
      "Idea",
      "Demo",
      "Recording",
      "Mixing",
      "Mastering",
      "ReleasePreparation",
      "ContentCampaign",
      "Released",
    ]);
    expect(SONG_STATUS_LABELS.ContentCampaign).toBe("Content Campaign");
  });
});
