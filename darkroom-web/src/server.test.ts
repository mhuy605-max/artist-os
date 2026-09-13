import { describe, expect, test } from "vitest";

import server from "./server";

describe("server health endpoint", () => {
  test("returns a fast 200 response without loading the app", async () => {
    const response = await server.fetch(new Request("http://localhost/healthz"), {}, {});

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(await response.text()).toBe("healthy");
  });
});
