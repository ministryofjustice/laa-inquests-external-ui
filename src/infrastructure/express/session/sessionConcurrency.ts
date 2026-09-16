import type { Request } from "express";
import { promisify } from "node:util";

// Serialises session read-modify-write per session id so overlapping requests cannot overwrite
// one another's changes (a lost-update race). Each task runs only once the previous task for the
// same session has settled, and the map entry is dropped once the chain drains.
const sessionUpdateChains = new Map<string, Promise<void>>();

const settleQuietly = (): void => undefined;

export async function runExclusivePerSession(
  sessionId: string,
  task: () => Promise<void>,
): Promise<void> {
  const previous = sessionUpdateChains.get(sessionId) ?? Promise.resolve();
  const current = previous.then(task);
  const normalised = current.catch(settleQuietly);
  sessionUpdateChains.set(sessionId, normalised);

  try {
    await current;
  } finally {
    if (sessionUpdateChains.get(sessionId) === normalised) {
      sessionUpdateChains.delete(sessionId);
    }
  }
}

export async function saveSession(req: Request): Promise<void> {
  await promisify((callback: (error: Error | null) => void): void => {
    req.session.save(callback);
  })();
}

export async function reloadSession(req: Request): Promise<void> {
  await promisify((callback: (error: Error | null) => void): void => {
    req.session.reload(callback);
  })();
}
