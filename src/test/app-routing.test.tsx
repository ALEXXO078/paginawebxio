import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { canAccessAdmin, isAdminEmail } from "@/lib/auth";
import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ADMIN_EMAILS", "admin@adsstore.com, soporte@adsstore.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("allows only the configured admin email to access the admin dashboard", () => {
    expect(isAdminEmail("admin@adsstore.com")).toBe(true);
    expect(isAdminEmail("cliente@correo.com")).toBe(false);
    expect(canAccessAdmin("admin@adsstore.com", false)).toBe(true);
    expect(canAccessAdmin("cliente@correo.com", false)).toBe(false);
  });
});
