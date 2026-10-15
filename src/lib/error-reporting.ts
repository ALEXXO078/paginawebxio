export function reportRuntimeError(error: unknown, context: Record<string, unknown> = {}) {
  console.error("Application error", { error, ...context });
}